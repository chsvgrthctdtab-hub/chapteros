import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  X,
  Plus,
  TrendingUp,
  TrendingDown,
  Layers,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Lock,
  Edit2,
  Trash2,
} from 'lucide-react';
import {
  categoryFormSchema,
  type CategoryFormData,
} from '../schemas/finance.schema';
import type { FinanceCategoryOption, FinanceType } from '../types/finance.types';

interface CategoryManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: FinanceCategoryOption[];
  onCreateCategory: (data: CategoryFormData) => Promise<void>;
  onUpdateCategory?: (categoryId: string, data: Partial<CategoryFormData>) => Promise<void>;
  onDeleteCategory?: (categoryId: string) => Promise<void>;
  isLoading?: boolean;
  canManage: boolean;
}

export function CategoryManagementModal({
  isOpen,
  onClose,
  categories,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  isLoading = false,
  canManage,
}: CategoryManagementModalProps) {
  const [activeTab, setActiveTab] = useState<FinanceType>('income');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FinanceCategoryOption | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<FinanceCategoryOption | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form for create
  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    reset: resetCreate,
    formState: { errors: errorsCreate, isSubmitting: isSubmittingCreate },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      type: 'income',
      name: '',
      description: '',
    },
  });

  // Form for edit
  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    setValue: setEditValue,
    formState: { errors: errorsEdit, isSubmitting: isSubmittingEdit },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
  });

  const handleStartEdit = (cat: FinanceCategoryOption) => {
    setEditingCategory(cat);
    setErrorMessage(null);
    setSuccessMessage(null);
    setEditValue('name', cat.name);
    setEditValue('type', cat.type);
    setEditValue('description', cat.description || '');
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    resetEdit();
  };

  const handleFormCreate = async (data: CategoryFormData) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await onCreateCategory({
        ...data,
        type: activeTab,
      });
      resetCreate();
      setIsCreatingNew(false);
      setSuccessMessage('Đã thêm danh mục mới thành công!');
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message || 'Không thể tạo danh mục');
    }
  };

  const handleFormEdit = async (data: CategoryFormData) => {
    if (!editingCategory || !onUpdateCategory) return;
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await onUpdateCategory(editingCategory.id, {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        type: editingCategory.type,
      });
      setEditingCategory(null);
      resetEdit();
      setSuccessMessage('Đã cập nhật danh mục thành công!');
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message || 'Không thể cập nhật danh mục');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCategory || !onDeleteCategory) return;
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await onDeleteCategory(deletingCategory.id);
      setDeletingCategory(null);
      setSuccessMessage('Đã xóa danh mục thành công!');
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message || 'Không thể xóa danh mục này');
    }
  };

  const incomeCategories = categories.filter((c) => c.type === 'income');
  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const currentCategories = activeTab === 'income' ? incomeCategories : expenseCategories;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Danh mục Thu - Chi
              </h3>
              <p className="text-xs text-slate-500">
                Quản lý các hạng mục phân loại tài chính trong Đơn vị
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher: Thu vs Chi */}
        <div className="px-6 pt-4 pb-2">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/60">
            <button
              type="button"
              onClick={() => {
                setActiveTab('income');
                setIsCreatingNew(false);
                setEditingCategory(null);
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'income'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Danh mục Thu ({incomeCategories.length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('expense');
                setIsCreatingNew(false);
                setEditingCategory(null);
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'expense'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Danh mục Chi ({expenseCategories.length})</span>
            </button>
          </div>
        </div>

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="mx-6 mt-3 p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="text-xs text-rose-700 leading-relaxed font-medium">{errorMessage}</p>
          </div>
        )}

        {successMessage && (
          <div className="mx-6 mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-700 leading-relaxed font-medium">{successMessage}</p>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 space-y-4 max-h-[55vh] overflow-y-auto">
          {/* List of categories */}
          <div className="space-y-2">
            {currentCategories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-white hover:border-slate-300 transition-all group"
              >
                <div className="space-y-0.5 flex-1 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">
                      {cat.name}
                    </span>
                    {cat.isSystem ? (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium bg-slate-200/70 text-slate-600 px-1.5 py-0.5 rounded">
                        <Lock className="w-2.5 h-2.5" />
                        Mặc định
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                        Chi hội tạo
                      </span>
                    )}
                  </div>
                  {cat.description && (
                    <p className="text-xs text-slate-500 line-clamp-1">
                      {cat.description}
                    </p>
                  )}
                </div>

                {canManage && !cat.isSystem && (
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                    {onUpdateCategory && (
                      <button
                        type="button"
                        onClick={() => handleStartEdit(cat)}
                        title="Sửa danh mục"
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {onDeleteCategory && (
                      <button
                        type="button"
                        onClick={() => {
                          setDeletingCategory(cat);
                          setErrorMessage(null);
                        }}
                        title="Xóa danh mục"
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Edit Form Modal/Section */}
          {editingCategory && (
            <form
              onSubmit={handleSubmitEdit(handleFormEdit)}
              className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-200 space-y-3 animate-in fade-in duration-150"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                  Chỉnh sửa danh mục: {editingCategory.name}
                </h4>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-slate-400 hover:text-slate-600 text-xs"
                >
                  Hủy
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên danh mục <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  {...registerEdit('name')}
                  className={`w-full px-3 py-1.5 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 ${
                    errorsEdit.name ? 'border-rose-300' : 'border-slate-200'
                  }`}
                />
                {errorsEdit.name && (
                  <p className="text-xs text-rose-600 mt-1">{errorsEdit.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mô tả
                </label>
                <input
                  type="text"
                  {...registerEdit('description')}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit || isLoading}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                >
                  {isSubmittingEdit || isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>Cập nhật</span>
                </button>
              </div>
            </form>
          )}

          {/* Delete Category Confirmation Dialog */}
          {deletingCategory && (
            <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-rose-900">
                    Xác nhận xóa danh mục "{deletingCategory.name}"?
                  </h4>
                  <p className="text-xs text-rose-700 mt-1">
                    Nếu danh mục đã có giao dịch phát sinh, hệ thống sẽ ngăn chặn việc xóa để đảm bảo toàn vẹn kế toán.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDeletingCategory(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isLoading}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Đang xóa...' : 'Xóa danh mục'}
                </button>
              </div>
            </div>
          )}

          {/* Quick Add Custom Category form */}
          {canManage && !editingCategory && !deletingCategory && (
            <div className="pt-2">
              {!isCreatingNew ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingNew(true);
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/40 text-slate-600 hover:text-blue-600 rounded-xl text-xs font-bold transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    Thêm danh mục {activeTab === 'income' ? 'thu' : 'chi'} mới
                  </span>
                </button>
              ) : (
                <form
                  onSubmit={handleSubmitCreate(handleFormCreate)}
                  className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Tạo danh mục {activeTab === 'income' ? 'thu' : 'chi'} mới
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsCreatingNew(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs"
                    >
                      Hủy
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tên danh mục <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Ủng hộ từ Cựu sinh viên..."
                      {...registerCreate('name')}
                      className={`w-full px-3 py-1.5 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 ${
                        errorsCreate.name ? 'border-rose-300' : 'border-slate-200'
                      }`}
                    />
                    {errorsCreate.name && (
                      <p className="text-xs text-rose-600 mt-1">{errorsCreate.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mô tả / Ghi chú (Tùy chọn)
                    </label>
                    <input
                      type="text"
                      placeholder="Mô tả phạm vi thu/chi của danh mục này..."
                      {...registerCreate('description')}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={isSubmittingCreate || isLoading}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                    >
                      {isSubmittingCreate || isLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      <span>Lưu danh mục</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
