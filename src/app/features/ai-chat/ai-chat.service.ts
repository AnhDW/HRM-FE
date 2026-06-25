import { Injectable, signal, inject } from '@angular/core';
import { ChatMessage } from './ai-chat.model';
import { RagService } from './rag.service';
import { Api } from '../../services/api-services/api';
import { apiEmployeesGet$Json } from '../../services/api-services/fn/employees/api-employees-get-json';
import { apiEmployeesIdGet$Json } from '../../services/api-services/fn/employees/api-employees-id-get-json';
import { apiDepartmentsGet$Json } from '../../services/api-services/fn/departments/api-departments-get-json';
import { apiLeaveRequestsGet$Json } from '../../services/api-services/fn/leave-requests/api-leave-requests-get-json';
import { apiPayslipsGet$Json } from '../../services/api-services/fn/payslips/api-payslips-get-json';
import { apiAttendancesGet$Json } from '../../services/api-services/fn/attendances/api-attendances-get-json';
import { apiAttendancesIdGet$Json } from '../../services/api-services/fn/attendances/api-attendances-id-get-json';


const LM_CHAT_URL = '/api/lm-studio/v1/chat/completions';
const LM_MODEL = 'qwen/qwen2.5-7b-instruct'; // Thay bằng model bạn tải trên LM Studio

const TOOLS: any[] = [
  {
    type: 'function',
    function: {
      name: 'get_employees',
      description: 'Tìm kiếm danh sách nhân viên. Có thể lọc theo tên, email, hoặc lấy tất cả. Để lọc theo phòng ban, dùng get_employees_by_department.',
      parameters: {
        type: 'object',
        properties: {
          FullName: { type: 'string', description: 'Lọc theo tên nhân viên (tiếng Việt)' },
          Email: { type: 'string', description: 'Lọc theo email' },
          FullNameAndEmail: { type: 'string', description: 'Tìm kiếm theo tên hoặc email' },
          PageNumber: { type: 'number', description: 'Trang số (mặc định 1)' },
          PageSize: { type: 'number', description: 'Số bản ghi mỗi trang (mặc định 50)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_employee_by_id',
      description: 'Lấy thông tin chi tiết một nhân viên theo ID.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'number', description: 'ID của nhân viên' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_departments',
      description: 'Lấy danh sách tất cả phòng ban trong công ty.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_leave_requests',
      description: 'Lấy danh sách đơn nghỉ phép. Có thể lọc theo nhân viên hoặc trạng thái.',
      parameters: {
        type: 'object',
        properties: {
          EmployeeId: { type: 'number', description: 'Lọc theo ID nhân viên' },
          Status: { type: 'string', description: 'Lọc theo trạng thái: Pending, Approved, Rejected', enum: ['Pending', 'Approved', 'Rejected'] },
          PageNumber: { type: 'number' },
          PageSize: { type: 'number' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_payslips',
      description: 'Lấy danh sách bảng lương. Có thể lọc theo nhân viên, tháng, năm.',
      parameters: {
        type: 'object',
        properties: {
          EmployeeId: { type: 'number', description: 'Lọc theo ID nhân viên' },
          Month: { type: 'number', description: 'Lọc theo tháng (1-12)' },
          Year: { type: 'number', description: 'Lọc theo năm' },
          PageNumber: { type: 'number' },
          PageSize: { type: 'number' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_attendances',
      description: 'Lấy danh sách chấm công. Có thể lọc theo PayslipId.',
      parameters: {
        type: 'object',
        properties: {
          PayslipId: { type: 'number', description: 'Lọc theo ID bảng lương' },
          PageNumber: { type: 'number' },
          PageSize: { type: 'number' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_attendance_by_id',
      description: 'Lấy chi tiết một bản ghi chấm công theo ID.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'number', description: 'ID của bản ghi chấm công' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_employees_by_department',
      description: 'Lấy danh sách nhân viên thuộc một phòng ban. Nhập tên phòng ban bằng tiếng Việt, không cần ID. Ví dụ: "Phòng Kỹ thuật", "Phòng Nhân sự", "Phòng Kế toán", "Phòng Kinh doanh".',
      parameters: {
        type: 'object',
        properties: {
          departmentName: { type: 'string', description: 'Tên phòng ban (tiếng Việt, ví dụ: Phòng Kỹ thuật, Phòng Nhân sự, Phòng Kế toán, Phòng Kinh doanh)' },
        },
        required: ['departmentName'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_department_head',
      description: 'Lấy thông tin trưởng phòng (người đứng đầu) của một phòng ban. Nhập tên phòng ban bằng tiếng Việt.',
      parameters: {
        type: 'object',
        properties: {
          departmentName: { type: 'string', description: 'Tên phòng ban (tiếng Việt, ví dụ: Phòng Kỹ thuật, Phòng Nhân sự)' },
        },
        required: ['departmentName'],
      },
    },
  },
];

@Injectable({ providedIn: 'root' })
export class AiChatService {
  private rag = inject(RagService);
  private api = inject(Api);

  messages = signal<ChatMessage[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  ragReady = signal(false);
  usingTools = signal(false);

  private abortController: AbortController | null = null;

  addMessage(msg: ChatMessage) {
    this.messages.update(m => [...m, { ...msg, timestamp: new Date() }]);
  }

  clearMessages() {
    this.messages.set([]);
  }

  stopStreaming() {
    this.abortController?.abort();
    this.loading.set(false);
    this.usingTools.set(false);
  }

  async sendMessage(userMessage: string) {
    if (!userMessage.trim() || this.loading()) return;

    this.addMessage({ role: 'user', content: userMessage });
    this.loading.set(true);
    this.error.set(null);
    this.usingTools.set(false);

    this.abortController = new AbortController();

    try {
      if (!this.rag.loaded()) {
        await this.rag.loadIndex();
        this.ragReady.set(true);
      }

      const contextChunks = await this.rag.search(userMessage);
      const context = contextChunks.map(c => c.text).join('\n\n---\n\n');
      const systemPrompt = context
        ? this.rag.buildSystemPrompt(context)
        : 'Bạn là trợ lý AI cho hệ thống HRM. Trả lời bằng tiếng Việt, ngắn gọn, chính xác. Khi cần dữ liệu thực tế (danh sách nhân viên, phòng ban, lương...), hãy sử dụng các công cụ được cung cấp. Khi hướng dẫn cách dùng tính năng, ưu tiên hướng dẫn từng bước trong giao diện, không chủ động đưa ra URL hay API. Tuy nhiên nếu người dùng hỏi cụ thể về đường dẫn (path, URL, route) tới chức năng nào đó, hãy trả lời cho họ.';

      // Build messages for API (reused if second request needed)
      function buildApiMessages(messages: ChatMessage[]): any[] {
        const msgs: any[] = messages
          .filter(m => m.role !== 'system')
          .map(m => {
            const msg: any = { role: m.role };
            if (m.content !== null) msg.content = m.content;
            if (m.tool_calls) msg.tool_calls = m.tool_calls;
            if (m.tool_call_id) msg.tool_call_id = m.tool_call_id;
            return msg;
          });
        msgs.unshift({ role: 'system', content: systemPrompt });
        return msgs;
      }

      const abortSignal = this.abortController.signal;

      // Shared SSE parser
      const streamResponse = async (messages: any[], onContent: (text: string) => void): Promise<{ finishReason: string | null; toolCalls: Map<number, any>; content: string }> => {
        const res = await fetch(LM_CHAT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: abortSignal,
            body: JSON.stringify({
              model: LM_MODEL,
              messages,
              tools: TOOLS,
              tool_choice: 'auto',
              stream: true,
              max_tokens: 2048,
              temperature: 0.7,
            }),
          });

          if (!res.ok) {
            const errText = await res.text().catch(() => '');
            throw new Error(`API error ${res.status}: ${errText || res.statusText}`);
          }

          const reader = res.body!.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          let currentContent = '';
          const toolCallAccumulators = new Map<number, any>();
          let finishReason: string | null = null;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith('data: ')) continue;
              const data = trimmed.slice(6);
              if (data === '[DONE]') continue;

              try {
                const json = JSON.parse(data);
                const choice = json.choices?.[0];
                if (!choice) continue;
                if (choice.finish_reason) finishReason = choice.finish_reason;

                const delta = choice.delta || {};

                if (delta.content) {
                  currentContent += delta.content;
                  onContent(delta.content);
                }

                if (delta.tool_calls) {
                  for (const tc of delta.tool_calls) {
                    const index = tc.index;
                    if (!toolCallAccumulators.has(index)) {
                      toolCallAccumulators.set(index, {
                        id: tc.id || '',
                        type: tc.type || 'function',
                        function: { name: '', arguments: '' },
                      });
                    }
                    const acc = toolCallAccumulators.get(index)!;
                    if (tc.id) acc.id = tc.id;
                    if (tc.type) acc.type = tc.type;
                    if (tc.function?.name) acc.function.name += tc.function.name;
                    if (tc.function?.arguments) acc.function.arguments += tc.function.arguments;
                  }
                }
              } catch {
                // skip malformed chunks
              }
            }
          }

          return { finishReason, toolCalls: toolCallAccumulators, content: currentContent };
        };

      // Push a placeholder assistant message for the loading indicator
      const streamMsg: ChatMessage = { role: 'assistant', content: '' };
      this.messages.update(m => [...m, streamMsg]);

      let apiMessages = buildApiMessages(this.messages().filter(m => m !== streamMsg));
      let hasShownContent = false;

      const { finishReason, toolCalls, content } = await streamResponse(apiMessages, (text) => {
        hasShownContent = true;
        streamMsg.content = (streamMsg.content || '') + text;
        this.messages.set([...this.messages()]);
      });

      // If tool calls were requested
      if (finishReason === 'tool_calls' && toolCalls.size > 0) {
        this.usingTools.set(true);
        const calls = Array.from(toolCalls.values());

        // Remove the placeholder (it has no content since model went straight to tools)
        this.messages.update(m => m.filter(msg => msg !== streamMsg));
        apiMessages = buildApiMessages(this.messages());

        // Add tool_calls message
        const toolCallMsg: ChatMessage = {
          role: 'assistant',
          content: null,
          tool_calls: calls.map((tc: any) => ({
            id: tc.id,
            type: tc.type,
            function: { name: tc.function.name, arguments: tc.function.arguments },
          })),
        };
        this.messages.update(m => [...m, toolCallMsg]);
        apiMessages.push({
          role: 'assistant',
          content: null,
          tool_calls: calls.map((tc: any) => ({
            id: tc.id,
            type: tc.type,
            function: { name: tc.function.name, arguments: tc.function.arguments },
          })),
        });

        // Execute tools
        for (const tc of calls) {
          let result: any;
          try {
            const args = JSON.parse(tc.function.arguments || '{}');
            result = await this.executeTool(tc.function.name, args);
          } catch (err: any) {
            result = { error: err.message || 'Lỗi khi gọi API' };
          }
          const toolMsg: ChatMessage = { role: 'tool', tool_call_id: tc.id, content: JSON.stringify(result) };
          this.messages.update(m => [...m, toolMsg]);
          apiMessages.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(result) });
        }

        this.usingTools.set(false);

        // Stream final response with tool results
        const finalMsg: ChatMessage = { role: 'assistant', content: '' };
        this.messages.update(m => [...m, finalMsg]);

        await streamResponse(apiMessages, (text) => {
          finalMsg.content = (finalMsg.content || '') + text;
          this.messages.set([...this.messages()]);
        });
      }
      // If content was already streamed but somehow empty (edge case — model said nothing)
      else if (!hasShownContent && !content) {
        this.messages.update(m => m.filter(msg => msg !== streamMsg));
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      this.error.set(err.message || 'Lỗi kết nối đến LM Studio. Kiểm tra LM Studio đã chạy chưa.');
      this.messages.update(m => {
        const last = m[m.length - 1];
        if (last && last.role === 'assistant' && last.content === '') {
          return m.slice(0, -1);
        }
        return m;
      });
    } finally {
      this.loading.set(false);
      this.usingTools.set(false);
      this.abortController = null;
    }
  }

  private async executeTool(name: string, args: any): Promise<any> {
    switch (name) {
      case 'get_employees': {
        const resp = await this.api.invoke$Response(apiEmployeesGet$Json, {
          FullName: args.FullName,
          Email: args.Email,
          FullNameAndEmail: args.FullNameAndEmail,
          PageNumber: args.PageNumber || 1,
          PageSize: args.PageSize || 50,
        });
        return resp.body?.result || [];
      }

      case 'get_employee_by_id': {
        const resp = await this.api.invoke$Response(apiEmployeesIdGet$Json, { id: args.id });
        return resp.body?.result || null;
      }

      case 'get_departments': {
        const resp = await this.api.invoke$Response(apiDepartmentsGet$Json, {
          PageNumber: 1,
          PageSize: 50,
        });
        return resp.body?.result || [];
      }

      case 'get_leave_requests': {
        const resp = await this.api.invoke$Response(apiLeaveRequestsGet$Json, {
          EmployeeId: args.EmployeeId,
          Status: args.Status,
          PageNumber: args.PageNumber || 1,
          PageSize: args.PageSize || 50,
        });
        return resp.body?.result || [];
      }

      case 'get_payslips': {
        const resp = await this.api.invoke$Response(apiPayslipsGet$Json, {
          EmployeeId: args.EmployeeId,
          Month: args.Month,
          Year: args.Year,
          PageNumber: args.PageNumber || 1,
          PageSize: args.PageSize || 50,
        });
        return resp.body?.result || [];
      }

      case 'get_attendances': {
        const resp = await this.api.invoke$Response(apiAttendancesGet$Json, {
          PayslipId: args.PayslipId,
          PageNumber: args.PageNumber || 1,
          PageSize: args.PageSize || 50,
        });
        return resp.body?.result || [];
      }

      case 'get_attendance_by_id': {
        const resp = await this.api.invoke$Response(apiAttendancesIdGet$Json, { id: args.id });
        return resp.body?.result || null;
      }

      case 'get_employees_by_department': {
        const dept = await this.findDepartmentByName(args.departmentName);
        if (!dept) return { error: `Không tìm thấy phòng ban "${args.departmentName}"` };
        const ids = await this.getEmployeeIdsByDept(dept.id);
        if (!ids.length) return [];
        const empResp = await this.api.invoke$Response(apiEmployeesGet$Json, {
          EmployeeIds: ids, PageNumber: 1, PageSize: 50,
        });
        return empResp.body?.result || [];
      }

      case 'get_department_head': {
        const dept = await this.findDepartmentByName(args.departmentName);
        if (!dept) return { error: `Không tìm thấy phòng ban "${args.departmentName}"` };
        if (!dept.managerId) return { error: `Phòng ban "${args.departmentName}" chưa có trưởng phòng` };
        const empResp = await this.api.invoke$Response(apiEmployeesIdGet$Json, { id: dept.managerId });
        return empResp.body?.result || { error: 'Không tìm thấy thông tin nhân viên' };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  private async findDepartmentByName(name: string): Promise<any | null> {
    const deptResp = await this.api.invoke$Response(apiDepartmentsGet$Json, {
      PageNumber: 1, PageSize: 50,
    });
    const departments: any[] = deptResp.body?.result || [];
    const search = (name || '').toLowerCase().replace(/phòng\s*/g, '');
    return departments.find((d: any) =>
      d.name?.toLowerCase().replace(/phòng\s*/g, '').includes(search)
    ) || null;
  }

  private async getEmployeeIdsByDept(departmentId: number | string): Promise<number[]> {
    try {
      const resp = await this.api.invoke$Response(apiEmployeesGet$Json, {
        PageSize: 50
      });
      if (resp.body.isSuccess && Array.isArray(resp.body.result)) {
        const deptId = Number(departmentId);
        return resp.body.result
          .filter((e: any) => e.departmentId === deptId)
          .map((e: any) => e.id);
      }
    } catch {}
    return [];
  }
}
