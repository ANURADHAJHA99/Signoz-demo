require('dotenv').config();
const logsAPI = require('@opentelemetry/api-logs');
const { LoggerProvider, SimpleLogRecordProcessor } = require('@opentelemetry/sdk-logs');
const { OTLPLogExporter } = require('@opentelemetry/exporter-logs-otlp-http');
const { OpenTelemetryTransportV3 } = require('@opentelemetry/winston-transport');
const { Resource } = require('@opentelemetry/resources');
const winston = require('winston');
const { trace } = require('@opentelemetry/api');

// Custom format for prettier logs
const prettyLog = winston.format.printf(({ level, message, timestamp, event, ...meta }) => {
  const { trace_id, span_id, trace_flags, service, timestamp: _, ...cleanMeta } = meta;
  
  // Format metadata
  const metaString = Object.keys(cleanMeta).length ? 
    `\n  ${JSON.stringify(cleanMeta, null, 2).replace(/\n/g, '\n  ')}` : '';

  return `${timestamp} [${level}] ${event}: ${message}${metaString}`;
});

// Initialize the Logger provider
const loggerProvider = new LoggerProvider({
  resource: new Resource({
    'service.name': 'nodejs-signoz-service',
    'service.version': '1.0.0',
  }),
});

// Configure OTLP exporter for SigNoz
const otlpExporter = new OTLPLogExporter({
  url: `${process.env.SIGNOZ_ENDPOINT}/v1/logs`,
  headers: {
    'signoz-access-token': process.env.SIGNOZ_TOKEN,
  },
});

loggerProvider.addLogRecordProcessor(new SimpleLogRecordProcessor(otlpExporter));
logsAPI.logs.setGlobalLoggerProvider(loggerProvider);

// Create Winston logger with enhanced formatting
const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format((info) => {
      const span = trace.getActiveSpan();
      if (span) {
        const spanContext = span.spanContext();
        info.trace_id = spanContext.traceId;
        info.span_id = spanContext.spanId;
        info.trace_flags = spanContext.traceFlags.toString(16);
      }
      return info;
    })(),
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true })
  ),
  defaultMeta: {
    service: 'nodejs-signoz-service'
  },
  transports: [
    // OpenTelemetry transport for SigNoz
    new OpenTelemetryTransportV3({
      loggerProvider,
      logAttributes: {
        'service.name': 'nodejs-signoz-service'
      },
    }),
    // Console transport with prettier formatting
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        prettyLog
      )
    })
  ],
});

module.exports = logger;