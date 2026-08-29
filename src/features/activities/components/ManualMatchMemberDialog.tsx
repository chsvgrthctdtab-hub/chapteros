import { useState } from 'react';
import {
  Search,
  UserCheck,
  X,
  Loader2,
  AlertCircle,
  GraduationCap,
  Mail,
  Phone,
} from 'lucide-react';
import type { ActivityFormResponse, Member } from '@/types';

interface ManualMatchMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  response: ActivityFormResponse | null;
  members: Member[];
  isLoadingMembers?: boolean;
  onMatch: (memberId: string) => Promise<void>;
  isMatching?: boolean;
}

export function ManualMatchMemberDialog({
  isOpen,
  onClose,
  response,
  members,
  isLoadingMembers = false,
  onMatch,
  isMatching = false,
}: ManualMatchMemberDialogProps) {
  const [search, setSearch] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  if (!isOpen || !response) return null;

  const filteredMembers = members.filter((m) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      m.fullName?.toLowerCase().includes(q) ||
      m.studentId?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.phone?.includes(q) ||
      m.className?.toLowerCase().includes(q)
    );
  });

  const handleConfirmMatch = async () => {
    if (!selectedMemberId) return;
    await onMatch(selectedMemberId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        id="manual-match-member-modal"
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-slate-200"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Khớp thủ công với Hội viên</h3>
              <p className="text-[11px] text-slate-500">Liên kết phản hồi Google Form vào hồ sơ Chi hội</p>
            </div>
          </div>
          <button
            type="button"
            id="close-manual-match-modal-btn"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Response summary info */}
          <div className="p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-2 text-xs">
            <p className="font-bold text-amber-900">Thông tin phản hồi từ Google Form:</p>
            <div className="grid grid-cols-2 gap-2 text-slate-700">
              <div>
                <span className="text-slate-400">Họ và tên:</span>{' '}
                <span className="font-semibold text-slate-900">{response.fullName || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400">MSSV:</span>{' '}
                <span className="font-mono font-semibold text-slate-900">{response.studentId || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400">Email:</span>{' '}
                <span className="text-slate-900">{response.respondentEmail || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400">Lớp:</span>{' '}
                <span className="text-slate-900">{response.className || '—'}</span>
              </div>
            </div>
          </div>

          {/* Search Member input */}
          <div className="space-y-2">
            <label htmlFor="search-match-member-input" className="block text-xs font-bold text-slate-800">
              Tìm kiếm Hội viên Chi hội để liên kết:
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                id="search-match-member-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo Tên, MSSV, Email, Lớp..."
                className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Members list */}
          <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto divide-y divide-slate-100">
            {isLoadingMembers ? (
              <div className="py-8 flex items-center justify-center gap-2 text-xs text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                <span>Đang tải danh sách hội viên...</span>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Không tìm thấy hội viên phù hợp
              </div>
            ) : (
              filteredMembers.map((m) => {
                const isSelected = selectedMemberId === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMemberId(m.id)}
                    className={`w-full p-3 text-left flex items-center justify-between gap-3 text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50/80 text-indigo-950 ring-1 ring-inset ring-indigo-300'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-slate-900">{m.fullName}</p>
                        {m.studentId && (
                          <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-semibold">
                            {m.studentId}
                          </span>
                        )}
                        {m.className && (
                          <span className="text-[10px] text-slate-500">{m.className}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                        {m.email && <span className="truncate">{m.email}</span>}
                        {m.phone && <span>• {m.phone}</span>}
                      </div>
                    </div>

                    <input
                      type="radio"
                      name="selected_member"
                      checked={isSelected}
                      onChange={() => setSelectedMemberId(m.id)}
                      className="rounded-full text-indigo-600 focus:ring-indigo-500 shrink-0"
                    />
                  </button>
                );
              })
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              id="cancel-match-member-btn"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Đóng
            </button>

            <button
              type="button"
              id="confirm-match-member-btn"
              disabled={!selectedMemberId || isMatching}
              onClick={handleConfirmMatch}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {isMatching ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang liên kết...</span>
                </>
              ) : (
                <span>Xác nhận khớp hội viên</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
