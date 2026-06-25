const fs = require('fs');
const path = require('path');

const SWAGGER_PATH = path.join(__dirname, '..', 'swagger-v1.json');
const OUTPUT_PATH = path.join(__dirname, '..', 'src', 'assets', 'rag-index.json');
const LM_STUDIO_URL = 'http://localhost:1234';
const EMBEDDING_MODEL = 'text-embedding-nomic-embed-text-v1.5';

const IGNORED_PATHS = ['PUT /api/Attendances/timekeeping'];

const ROUTE_CONTEXT = [
  { path: '/dashboard', label: 'Tổng quan', module: 'employee', desc: 'Dashboard tổng quan hoạt động hàng ngày' },
  { path: '/attendance', label: 'Chấm công', module: 'employee', desc: 'Quản lý chấm công cá nhân, lịch làm việc' },
  { path: '/leave-requests', label: 'Nghỉ phép', module: 'employee', desc: 'Gửi yêu cầu nghỉ phép và theo dõi trạng thái' },
  { path: '/payroll', label: 'Bảng lương', module: 'employee', desc: 'Theo dõi thu nhập tháng, phiếu lương' },
  { path: '/calendar', label: 'Lịch công tác', module: 'employee', desc: 'Xem lịch họp, sự kiện, deadline công việc' },
  { path: '/organization', label: 'Sơ đồ tổ chức', module: 'employee', desc: 'Xem sơ đồ tổ chức, phòng ban' },
  { path: '/profile', label: 'Hồ sơ cá nhân', module: 'employee', desc: 'Thông tin cá nhân, kinh nghiệm làm việc' },
  { path: '/settings', label: 'Cài đặt', module: 'employee', desc: 'Tùy chọn tài khoản, thông báo, hiển thị' },
  { path: '/ai-chat', label: 'Trợ lý AI', module: 'employee', desc: 'Trò chuyện với AI để được hỗ trợ về HRM' },
  { path: '/admin/attendance', label: 'Quản lý chấm công', module: 'admin', desc: 'Xem chi tiết chấm công theo nhân viên, chấm công thủ công' },
  { path: '/admin/leave', label: 'Duyệt nghỉ phép', module: 'admin', desc: 'Duyệt/từ chối đơn nghỉ phép của nhân viên' },
  { path: '/admin/employees', label: 'Quản lý nhân sự', module: 'admin', desc: 'Danh sách nhân viên, thêm mới, tìm kiếm, cấu hình lương' },
  { path: '/admin/organization', label: 'Cơ cấu tổ chức', module: 'admin', desc: 'Quản lý phòng ban, nhóm, phân cấp' },
  { path: '/admin/payroll', label: 'Quản lý lương', module: 'admin', desc: 'Xem, sửa, xóa phiếu lương nhân viên' },
  { path: '/admin/calendar', label: 'Lịch công tác', module: 'admin', desc: 'Quản lý lịch họp, sự kiện công ty' },
  { path: '/admin/ai-chat', label: 'Trợ lý AI', module: 'admin', desc: 'Trò chuyện với AI để được hỗ trợ về HRM' },
];

function formatFieldType(schema) {
  if (!schema) return 'unknown';
  if (schema.$ref) return schema.$ref.split('/').pop();
  if (schema.type === 'array' && schema.items) return `${formatFieldType(schema.items)}[]`;
  if (schema.type === 'object' && schema.properties) return 'object';
  if (schema.enum) return `enum (${schema.enum.join(', ')})`;
  if (Array.isArray(schema.type)) return schema.type.filter(t => t !== 'null').join(' | ') || schema.type[0];
  return schema.type || 'string';
}

function describeSchema(schemas, name, depth = 0) {
  if (depth > 3 || !schemas[name]) return '';
  const schema = schemas[name];
  if (schema.enum) {
    return `Enum ${name}: ${schema.enum.join(', ')}`;
  }
  if (!schema.properties) return `Type: ${schema.type || 'object'}`;
  const fields = Object.entries(schema.properties).map(([fieldName, fieldSchema]) => {
    const type = formatFieldType(fieldSchema);
    const required = schema.required?.includes(fieldName) ? '' : ' (optional)';
    return `  - ${fieldName}${required}: ${type}`;
  });
  return `${name}:\n${fields.join('\n')}`;
}

function buildEndpointChunks(swagger) {
  const chunks = [];
  const { paths, components } = swagger;
  const schemas = components?.schemas || {};

  for (const [pathName, methods] of Object.entries(paths)) {
    for (const [method, details] of Object.entries(methods)) {
      const key = `${method.toUpperCase()} ${pathName}`;
      if (IGNORED_PATHS.includes(key)) continue;

      const summary = details.summary || '';
      const tags = details.tags || [];
      const params = (details.parameters || []).map(p =>
        `  - ${p.name} (${p.in}, ${formatFieldType(p.schema)})${p.required ? ' [required]' : ''}`
      );
      const requestBody = details.requestBody?.content?.['application/json']?.schema;
      const requestBodyRef = requestBody?.$ref ? requestBody.$ref.split('/').pop() : null;
      const requestBodyDesc = requestBodyRef ? `\nRequest Body: ${describeSchema(schemas, requestBodyRef)}` : '';
      const responses = details.responses?.['200']?.content?.['application/json']?.schema;
      const responseRef = responses?.$ref ? responses.$ref.split('/').pop() : null;
      const responseDesc = responseRef ? `\nResponse: ${describeSchema(schemas, responseRef)}` : '';

      const text = `API Endpoint: ${key}
Module: ${tags.join(', ')}
Summary: ${summary}
Parameters:${params.length ? '\n' + params.join('\n') : ' None'}
${requestBodyDesc}${responseDesc}`;

      chunks.push({
        id: `endpoint_${key.replace(/[^a-zA-Z0-9]/g, '_')}`,
        text,
        source: 'swagger',
        metadata: { type: 'endpoint', path: pathName, method, summary, tags },
      });
    }
  }
  return chunks;
}

function buildModelChunks(swagger) {
  const chunks = [];
  const schemas = swagger.components?.schemas || {};
  const skipModels = ['ResponseDto'];

  for (const [name] of Object.entries(schemas)) {
    if (skipModels.includes(name)) continue;
    const desc = describeSchema(schemas, name);
    if (!desc) continue;

    chunks.push({
      id: `model_${name}`,
      text: `Data Model: ${desc}`,
      source: 'swagger',
      metadata: { type: 'model', modelName: name },
    });
  }
  return chunks;
}

function buildRouteChunks() {
  return ROUTE_CONTEXT.map(r => ({
    id: `route_${r.path.replace(/[^a-zA-Z0-9]/g, '_')}`,
    text: `Trang: ${r.label}
Route: ${r.path}
Module: ${r.module}
Mô tả: ${r.desc}`,
    source: 'app-routes',
    metadata: { type: 'route', path: r.path, label: r.label, module: r.module },
  }));
}

async function generateEmbeddings(chunks) {
  const texts = chunks.map(c => c.text);
  const batches = [];
  const batchSize = 10;

  for (let i = 0; i < texts.length; i += batchSize) {
    batches.push(texts.slice(i, i + batchSize));
  }

  const allEmbeddings = [];
  let totalDone = 0;

  for (const batch of batches) {
    console.log(`Embedding batch ${totalDone + 1}-${Math.min(totalDone + batch.length, texts.length)} / ${texts.length}...`);
    try {
      const response = await fetch(`${LM_STUDIO_URL}/v1/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: EMBEDDING_MODEL,
          input: batch,
        }),
      });

      if (!response.ok) {
        throw new Error(`Embedding API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const embeddings = data.data.map(d => d.embedding);
      allEmbeddings.push(...embeddings);
      totalDone += batch.length;
    } catch (err) {
      console.error(`Batch failed: ${err.message}`);
      console.log('Falling back to mock embeddings...');
      for (let j = 0; j < batch.length; j++) {
        allEmbeddings.push(new Array(128).fill(0).map(() => Math.random() * 0.01));
        totalDone++;
      }
    }
  }

  return allEmbeddings;
}

async function main() {
  console.log('Reading swagger...');
  const swagger = JSON.parse(fs.readFileSync(SWAGGER_PATH, 'utf-8'));

  console.log('Building endpoint chunks...');
  const endpointChunks = buildEndpointChunks(swagger);

  console.log('Building model chunks...');
  const modelChunks = buildModelChunks(swagger);

  console.log('Building route chunks...');
  const routeChunks = buildRouteChunks();

  const allChunks = [...endpointChunks, ...modelChunks, ...routeChunks];
  console.log(`Total chunks: ${allChunks.length}`);

  console.log('Generating embeddings...');
  const embeddings = await generateEmbeddings(allChunks);

  const output = { chunks: allChunks, embeddings, model: EMBEDDING_MODEL, generatedAt: new Date().toISOString() };
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
  console.log(`Saved to ${OUTPUT_PATH}`);
}

main().catch(console.error);
