require('dotenv').config();
const opentelemetry = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const { WinstonInstrumentation } = require('@opentelemetry/instrumentation-winston');
const { BatchSpanProcessor } = require('@opentelemetry/sdk-trace-base');

const exporterOptions = {
  url: `${process.env.SIGNOZ_ENDPOINT}/v1/traces`
};

const traceExporter = new OTLPTraceExporter(exporterOptions);

const sdk = new opentelemetry.NodeSDK({
  traceExporter,
  spanProcessor: new BatchSpanProcessor(traceExporter),
  instrumentations: [
    getNodeAutoInstrumentations(),
    new WinstonInstrumentation({
      enabled: true,
      logHook: (span, record) => {
        record['service.name'] = 'nodejs-signoz-service';
        if (span) {
          const spanContext = span.spanContext();
          record.trace_id = spanContext.traceId;
          record.span_id = spanContext.spanId;
          record.trace_flags = spanContext.traceFlags.toString(16);
        }
      }
    })
  ],
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'nodejs-signoz-service'
  })
});

sdk.start();