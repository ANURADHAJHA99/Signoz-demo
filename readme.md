# Node.js Log Correlation with OpenTelemetry and SigNoz

This project demonstrates how to implement log correlation with traces in a Node.js application using OpenTelemetry and SigNoz. It includes a full-featured Express application with user management, post handling, performance testing, and error simulation endpoints.

## Architecture Overview

The application consists of three main components:

1. **Logger Configuration (logger.js)**
   - Winston for logging
   - OpenTelemetry integration for trace correlation
   - Custom formatting for readable logs

2. **Tracing Setup (tracing.js)**
   - OpenTelemetry SDK configuration
   - Auto-instrumentation setup
   - Trace context management

3. **Express Application (app.js)**
   - REST API endpoints
   - Request/Response logging
   - Error handling
   - Performance testing scenarios

## Installation

```bash
# Clone the repository
git clone https://github.com/your-username/nodejs-signoz-demo.git

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your SigNoz credentials
```

## Environment Configuration

```env
PORT=5555
NODE_ENV=development
SIGNOZ_TOKEN=your-signoz-token
SIGNOZ_ENDPOINT=https://ingest.in.signoz.cloud:443
```

## Code Implementation Details

### Logger Configuration (logger.js)

The logger is configured to correlate logs with traces:

```javascript
const logger = winston.createLogger({
  format: winston.format.combine(
    // Inject trace context
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
    winston.format.timestamp(),
    winston.format.json()
  )
});
```

Key features:
- Trace context injection
- Custom formatting for readability
- Multiple transport support (Console and SigNoz)

### Tracing Setup (tracing.js)

OpenTelemetry configuration for distributed tracing:

```javascript
const sdk = new opentelemetry.NodeSDK({
  traceExporter,
  spanProcessor: new BatchSpanProcessor(traceExporter),
  instrumentations: [
    getNodeAutoInstrumentations(),
    new WinstonInstrumentation({
      enabled: true,
      logHook: (span, record) => {
        record['service.name'] = 'nodejs-signoz-service';
        // Inject trace context
      }
    })
  ]
});
```

Features:
- Automatic instrumentation
- Batch processing for performance
- Custom instrumentation for Winston

### API Endpoints

#### User Management

```javascript
// Create User
POST /users
{
  "username": "test_user",
  "email": "test@example.com",
  "age": 25
}

// Response
{
  "id": "44c4d46f-5a25-438c-853a",
  "username": "test_user",
  "email": "test@example.com",
  "age": 25,
  "createdAt": "2025-02-17T19:04:35.297Z"
}
```

#### Post Management

```javascript
// Create Post
POST /posts
{
  "userId": "44c4d46f-5a25-438c-853a",
  "title": "Test Post",
  "content": "Post content"
}
```

#### Performance Testing

```javascript
// Test CPU-intensive operations
GET /performance-test/cpu-intensive

// Test memory-intensive operations
GET /performance-test/memory-intensive

// Test async operations
GET /performance-test/async-operations
```

#### Error Simulation

```javascript
// Simulate different types of errors
GET /simulate-error/reference   // ReferenceError
GET /simulate-error/type       // TypeError
GET /simulate-error/syntax     // SyntaxError
GET /simulate-error/custom     // Custom Error
```

### Log Output Examples

1. Request Received:
```json
{
  "event": "REQUEST_RECEIVED",
  "message": "🌟 New incoming request",
  "method": "POST",
  "path": "/users",
  "requestId": "57aa3e4a-c516-4a96-aad4-f3e9a080185e",
  "trace_id": "50f527d5ff12b8e0f24756bbf535adf0",
  "span_id": "65dfd566df8d9a49",
  "timestamp": "2025-02-17T19:04:35.287Z"
}
```

2. Error Log:
```json
{
  "event": "ERROR_SIMULATION_TRIGGERED",
  "message": "💥 Simulated error occurred",
  "error": "nonExistentVariable is not defined",
  "stack": "ReferenceError: nonExistentVariable is not defined...",
  "requestId": "dcff2036-ebdd-4258-99d9-e23a0e13fbfc",
  "trace_id": "04d4fdd6691702b28ce665c2ab67169d"
}
```

## Running the Application

```bash
# Development mode
node -r ./tracing.js app.js

# With environment variables
OTEL_EXPORTER_OTLP_HEADERS="signoz-access-token=YOUR_TOKEN" node -r ./tracing.js app.js
```

## Testing

Test different endpoints:

```bash
# Create user
curl -X POST http://localhost:5555/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_user",
    "email": "test@example.com",
    "age": 25
  }'

# Test performance
curl http://localhost:5555/performance-test/cpu-intensive

# Simulate error
curl http://localhost:5555/simulate-error/reference

# Check health
curl http://localhost:5555/health
```

## Monitoring in SigNoz

View your application metrics in SigNoz:
1. Access your SigNoz dashboard
2. Navigate to 'Services' section
3. Look for 'nodejs-signoz-service'
4. View traces, logs, and their correlation

## Error Handling

The application includes comprehensive error handling:
- Request validation
- Error simulation
- Global error handler
- Graceful shutdown

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request


Created by Anuradha with ❤️