import { useState, useMemo, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Search, UserPlus, AlertCircle, Loader2, Check, User } from 'lucide-react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  addParticipantSchema,
  type AddParticipantFormData,
} from '../schemas/activity.schema';
import {
  REGISTRATION_STATUSES,
  ATTENDANCE_STATUSES,
} from '../types/activity.types';
import type { Member } from '@/types';

interface AddParticipantDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AddParticipantFormData) => Promise<void>;
  availableMembers: Member[];
  isLoadingMembers?: boolean;
  isSubmitting?: boolean;
}

export function AddParticipantDialog({
  isOpen,
  onClose,
  onSubmit,
  availableMembers,
  isLoadingMembers = false,
  isSubmitting = false,
}: AddParticipantDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    control,
    formState: { errors },
  } = useForm<AddParticipantFormData>({
    resolver: zodResolver(addParticipantSchema) as never,
    defaultValues: {
      memberId: '',
      registrationStatus: 'registered',
      attendanceStatus: 'unmarked',
      notes: '',
    },
  });

  useEffect(() => {
    register('memberId');
  }, [register]);

  // Filter available members by search term
  const filteredMembers = useMemo(() => {
    if (!searchTerm.trim()) return availableMembers.slice(0, 15);
    const term = searchTerm.toLowerCase().trim();
    return availableMembers
      .filter(
        (m) =>
          m.fullName.toLowerCase().includes(term) ||
          (m.studentId && m.studentId.toLowerCase().includes(term)) ||
          (m.className && m.className.toLowerCase().includes(term))
      )
      .slice(0, 20);
  }, [availableMembers, searchTerm]);

  const handleSelectMember = (member: Member) => {
    setSelectedMember(member);
    setValue('memberId', member.id, { shouldValidate: true });
    setSubmitError(null);
  };

  const handleFormSubmit = async (data: AddParticipantFormData) => {
    setSubmitError(null);
    try {
      await onSubmit(data);
      handleClose();
    } catch (err) {
      setSubmitError((err as Error).message || 'Không thể thêm người tham gia');
    }
  };

  const handleClose = () => {
    setSelectedMember(null);
    setSearchTerm('');
    setSubmitError(null);
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        id="add-participant-dialog"
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Thêm người tham gia</h2>
              <p className="text-xs text-slate-500">Ghi danh hội viên Đơn vị vào hoạt động</p>
            </div>
          </div>
          <button
            type="button"
            id="close-add-participant-dialog-btn"
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Submit Error */}
          {submitError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Member Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Chọn hội viên <span className="text-rose-500">*</span>
            </label>

            {/* Member search input */}
            <div className="relative mb-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="participant-search-member-input"
                type="text"
                placeholder="Tìm theo họ tên, MSSV, lớp sinh viên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* Selected Member Preview Card */}
            {selectedMember ? (
              <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {selectedMember.fullName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{selectedMember.fullName}</p>
                    <p className="text-[11px] text-slate-500">
                      MSSV: <span className="font-mono font-medium text-slate-700">{selectedMember.studentId}</span>
                      {selectedMember.className && ` • ${selectedMember.className}`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMember(null);
                    setValue('memberId', '');
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium shrink-0 cursor-pointer"
                >
                  Đổi người
                </button>
              </div>
            ) : (
              /* Members selection list */
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-44 overflow-y-auto divide-y divide-slate-100 bg-white">
                {isLoadingMembers ? (
                  <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang tải danh sách hội viên...</span>
                  </div>
                ) : filteredMembers.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    {availableMembers.length === 0
                      ? 'Tất cả hội viên trong Đơn vị đã có trong hoạt động này'
                      : 'Không tìm thấy hội viên phù hợp với từ khóa'}
                  </div>
                ) : (
                  filteredMembers.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      id={`select-member-row-${member.id}`}
                      onClick={() => handleSelectMember(member)}
                      className="w-full p-2.5 px-3 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs flex items-center justify-center shrink-0">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 truncate">{member.fullName}</p>
                          <p className="text-[11px] text-slate-500">
                            MSSV: <span className="font-mono text-slate-700">{member.studentId}</span>
                            {member.className && ` • ${member.className}`}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-indigo-600 font-medium">Chọn</span>
                    </button>
                  ))
                )}
              </div>
            )}
            {errors.memberId && <p className="text-xs text-rose-600 mt-1">{errors.memberId.message}</p>}
          </div>

          {/* Registration Status & Attendance Status Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Registration Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Trạng thái đăng ký
              </label>
              <Controller
                name="registrationStatus"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || 'registered'}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id="participant-registration-status-select" className="w-full h-9 text-xs bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(REGISTRATION_STATUSES).map((s) => (
                        <SelectItem key={s.key} value={s.key}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Attendance Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Trạng thái điểm danh
              </label>
              <Controller
                name="attendanceStatus"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || 'unmarked'}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id="participant-attendance-status-select" className="w-full h-9 text-xs bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(ATTENDANCE_STATUSES).map((s) => (
                        <SelectItem key={s.key} value={s.key}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Ghi chú thêm (Tùy chọn)
            </label>
            <input
              id="participant-notes-input"
              type="text"
              placeholder="VD: Phụ trách đội hậu cần, đăng ký xe chung..."
              onChange={(e) => setValue('notes', e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              id="cancel-add-participant-btn"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              id="submit-add-participant-btn"
              disabled={isSubmitting || !selectedMember}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-xs focus:ring-2 focus:ring-indigo-500/30 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang ghi danh...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Thêm vào danh sách</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
