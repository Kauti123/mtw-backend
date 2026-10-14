import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule, type OpenAPIObject } from '@nestjs/swagger';

export interface SwaggerSetupOptions {
  title: string;
  description: string;
  version?: string;
  path?: string;
  tags?: ReadonlyArray<{ name: string; description: string }>;
}

const COMMON_RESPONSE_DESCRIPTION = `
## Common response envelope

All JSON APIs return:

\`\`\`json
{
  "statusCode": 200,
  "message": "Success",
  "data": {}
}
\`\`\`

- **statusCode** — HTTP status code
- **message** — human-readable result message
- **data** — payload (object, array, or null)

Errors use the same shape (\`data\` may be \`[]\` or validation details).

## Authentication

Protected routes require:

\`Authorization: Bearer <access_token>\`

Use **Authorize** after calling a public login endpoint (\`/v1/auth/login\` or \`/v1/auth/admin/login\`).
`.trim();

function wrapSchemaAsApiResponse(schema: unknown): Record<string, unknown> {
  return {
    type: 'object',
    required: ['statusCode', 'message', 'data'],
    properties: {
      statusCode: { type: 'integer', example: 200 },
      message: { type: 'string', example: 'Success' },
      data: schema ?? { nullable: true },
    },
  };
}

function applyCommonResponseEnvelope(document: OpenAPIObject): OpenAPIObject {
  document.components = document.components ?? {};
  document.components.schemas = {
    ...(document.components.schemas ?? {}),
    ApiResponse: {
      type: 'object',
      required: ['statusCode', 'message', 'data'],
      properties: {
        statusCode: { type: 'integer', example: 200 },
        message: { type: 'string', example: 'Success' },
        data: {
          description: 'Endpoint payload (object, array, or null)',
          nullable: true,
        },
      },
    },
  };

  for (const pathItem of Object.values(document.paths ?? {})) {
    if (!pathItem) continue;
    for (const method of [
      'get',
      'put',
      'post',
      'delete',
      'options',
      'head',
      'patch',
      'trace',
    ] as const) {
      const operation = pathItem[method];
      if (!operation?.responses) continue;

      for (const [status, response] of Object.entries(operation.responses)) {
        if (!response || typeof response !== 'object') continue;
        if (status === '204') continue;
        if (!/^(2\d\d)$/.test(status)) continue;

        const typed = response as {
          content?: Record<
            string,
            { schema?: unknown; example?: unknown; examples?: unknown }
          >;
          description?: string;
        };

        const json = typed.content?.['application/json'];
        if (!json) {
          typed.content = {
            ...(typed.content ?? {}),
            'application/json': {
              schema: wrapSchemaAsApiResponse({ nullable: true }),
            },
          };
          continue;
        }

        // Skip plain-text / already-wrapped schemas
        const existing = json.schema as Record<string, unknown> | undefined;
        if (
          existing &&
          Array.isArray(existing['required']) &&
          (existing['required'] as unknown[]).includes('statusCode') &&
          (existing['required'] as unknown[]).includes('message') &&
          (existing['required'] as unknown[]).includes('data')
        ) {
          continue;
        }

        json.schema = wrapSchemaAsApiResponse(json.schema ?? { nullable: true });
      }
    }
  }

  return document;
}

export function setupSwagger(
  app: INestApplication,
  options: SwaggerSetupOptions,
): void {
  const builder = new DocumentBuilder()
    .setTitle(options.title)
    .setDescription(`${options.description}\n\n${COMMON_RESPONSE_DESCRIPTION}`)
    .setVersion(options.version ?? '1.0.0')
    // Paths already include the Nest global prefix (`/v1/...`). A server of
    // `/v1` would make Swagger call `/v1/v1/...`.
    .addServer('/', 'Current host')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
        description: 'JWT access token from login / admin login',
      },
      'bearer',
    )
    .addApiKey(
      { type: 'apiKey', name: 'x-correlation-id', in: 'header' },
      'correlation-id',
    )
    .addApiKey(
      { type: 'apiKey', name: 'idempotency-key', in: 'header' },
      'idempotency-key',
    );

  for (const tag of options.tags ?? []) {
    builder.addTag(tag.name, tag.description);
  }

  const rawDocument = SwaggerModule.createDocument(app, builder.build(), {
    operationIdFactory: (controllerKey: string, methodKey: string) =>
      `${controllerKey}_${methodKey}`,
  });
  // Default security so Try-it-out sends Bearer unless a route is public.
  rawDocument.security = [{ bearer: [] }];
  const document = applyCommonResponseEnvelope(rawDocument);

  SwaggerModule.setup(options.path ?? 'docs', app, document, {
    customSiteTitle: `${options.title} — Swagger`,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'list',
      filter: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      tryItOutEnabled: true,
    },
  });
}
