import React, { useState } from "react";
import {
  Users,
  Calendar,
  DollarSign,
  CheckSquare,
  Search,
  Plus,
  Trash2,
  Edit2,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  Sparkles,
  Layers,
  Sliders,
  Type,
  Layout,
  Bell,
  MoreVertical,
  Loader2,
  HelpCircle,
} from "lucide-react";

// Production Primitives
import { Button, IconButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon, IconContainer } from "@/components/ui/icon";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input, SearchInput } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { EmptyState } from "@/components/common/EmptyState";
import { QueryErrorState } from "@/components/common/QueryErrorState";

export function ComponentPlaygroundPage() {
  const [activeTab, setActiveTab] = useState<string>("buttons");
  const [searchVal, setSearchVal] = useState<string>("Nguyễn Văn A");
  const [checkboxChecked, setCheckboxChecked] = useState<boolean>(true);
  const [switchChecked, setSwitchChecked] = useState<boolean>(true);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(2);
  const [selectedRole, setSelectedRole] = useState<string>("leader");

  return (
    <TooltipProvider>
      <div className="space-y-6 pb-16">
        {/* Page Header */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Material 3 UI System</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Component Showcase & Playground
              </h1>
              <p className="text-sm text-slate-500">
                Môi trường trực quan kiểm thử và xác thực 17 Primitive UI Components và Design Tokens của ChapterOS.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="success" showDot>
                Phase 1-3 Verified
              </Badge>
              <Badge variant="outline">Route: /dev/components</Badge>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/80">
            <TabsTrigger value="foundations" className="rounded-xl px-4 text-xs font-semibold">
              <Layers className="w-4 h-4 mr-1.5" />
              Foundations
            </TabsTrigger>
            <TabsTrigger value="buttons" className="rounded-xl px-4 text-xs font-semibold">
              <Sliders className="w-4 h-4 mr-1.5" />
              Buttons
            </TabsTrigger>
            <TabsTrigger value="forms" className="rounded-xl px-4 text-xs font-semibold">
              <Type className="w-4 h-4 mr-1.5" />
              Form Controls
            </TabsTrigger>
            <TabsTrigger value="surfaces" className="rounded-xl px-4 text-xs font-semibold">
              <Layout className="w-4 h-4 mr-1.5" />
              Surfaces
            </TabsTrigger>
            <TabsTrigger value="data" className="rounded-xl px-4 text-xs font-semibold">
              <CheckSquare className="w-4 h-4 mr-1.5" />
              Data & Tables
            </TabsTrigger>
            <TabsTrigger value="feedback" className="rounded-xl px-4 text-xs font-semibold">
              <Bell className="w-4 h-4 mr-1.5" />
              Feedback
            </TabsTrigger>
          </TabsList>

          {/* =========================================================================
              TAB 1: FOUNDATIONS
             ========================================================================= */}
          <TabsContent value="foundations" className="space-y-6 pt-4">
            {/* 1.1 Color Tokens */}
            <Card>
              <CardHeader>
                <CardTitle>1. Semantic Color Tokens</CardTitle>
                <CardDescription>
                  Hệ thống màu sắc ngữ nghĩa không gắn cứng với màu thương hiệu, cho phép thay thế theme toàn cục an toàn.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                  <div className="p-3.5 rounded-2xl bg-emerald-700 text-white space-y-1">
                    <p className="text-xs font-bold">Primary</p>
                    <p className="text-[10px] opacity-80">CTA & Key Actions</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-emerald-100 text-emerald-950 border border-emerald-300/60 space-y-1">
                    <p className="text-xs font-bold">Primary Container</p>
                    <p className="text-[10px] opacity-80">Active Nav & Chips</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-teal-700 text-white space-y-1">
                    <p className="text-xs font-bold">Secondary</p>
                    <p className="text-[10px] opacity-80">Auxiliary Action</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-teal-100 text-teal-950 border border-teal-300/60 space-y-1">
                    <p className="text-xs font-bold">Secondary Container</p>
                    <p className="text-[10px] opacity-80">Role & Tags</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-blue-700 text-white space-y-1">
                    <p className="text-xs font-bold">Tertiary</p>
                    <p className="text-[10px] opacity-80">Terms & Sync</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-rose-600 text-white space-y-1">
                    <p className="text-xs font-bold">Error / Destructive</p>
                    <p className="text-[10px] opacity-80">Critical / Deficit</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 pt-2">
                  <div className="p-3.5 rounded-2xl bg-surface border border-slate-200 text-slate-900 space-y-1">
                    <p className="text-xs font-bold">Surface Base</p>
                    <p className="text-[10px] text-slate-500">#F8FAF9</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-surface-container border border-slate-200 text-slate-900 space-y-1">
                    <p className="text-xs font-bold">Surface Container</p>
                    <p className="text-[10px] text-slate-500">#F1F5F9</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
                    <p className="text-xs font-bold">Success Status</p>
                    <p className="text-[10px] text-emerald-700">#059669</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                    <p className="text-xs font-bold">Warning Status</p>
                    <p className="text-[10px] text-amber-700">#D97706</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 space-y-1">
                    <p className="text-xs font-bold">Info Status</p>
                    <p className="text-[10px] text-blue-700">#2563EB</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 1.2 Typography Hierarchy */}
            <Card>
              <CardHeader>
                <CardTitle>2. Typography Hierarchy</CardTitle>
                <CardDescription>
                  Quy chuẩn 5 cấp độ chữ Material 3 kết hợp font-mono cho dữ liệu kỹ thuật.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-mono text-slate-400">Headline Large (24-30px)</span>
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                    Báo cáo Tổng quan Nhiệm kỳ
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-mono text-slate-400">Title Medium (16-18px)</span>
                  <span className="text-base sm:text-lg font-bold text-slate-900">
                    Danh sách Ban Chấp Hành Chi hội
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-mono text-slate-400">Body Medium (14px)</span>
                  <span className="text-sm text-slate-600">
                    Văn bản hướng dẫn quy trình tổ chức hoạt động tình nguyện hè 2026.
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-mono text-slate-400">Label Small / Overline (10-11px)</span>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    NGÀY TẠO • TRẠNG THÁI • VAI TRÒ
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between">
                  <span className="text-xs font-mono text-slate-400">Technical Identifier (Mono 12px)</span>
                  <span className="font-mono text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                    MSSV: B2101234 • QUỸ: +15,500,000 ₫ • TASK: #TSK-2026-08
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* 1.3 Shapes Scale */}
            <Card>
              <CardHeader>
                <CardTitle>3. Semantic Shape Scale</CardTitle>
                <CardDescription>
                  Hình khối phân tầng theo chức năng tương tác (không bo tròn 28px đại trà).
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
                <div className="p-4 bg-slate-100 rounded-full border border-slate-200 text-xs font-semibold">
                  shape-full (Pill)
                </div>
                <div className="p-4 bg-slate-100 rounded-3xl border border-slate-200 text-xs font-semibold">
                  shape-xl (28px)
                </div>
                <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-semibold">
                  shape-lg (16px)
                </div>
                <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
                  shape-md (12px)
                </div>
                <div className="p-4 bg-slate-100 rounded-lg border border-slate-200 text-xs font-semibold">
                  shape-sm (8px)
                </div>
                <div className="p-4 bg-slate-100 rounded-md border border-slate-200 text-xs font-semibold">
                  shape-xs (4px)
                </div>
              </CardContent>
            </Card>

            {/* 1.4 Material Symbols & Icon Containers */}
            <Card>
              <CardHeader>
                <CardTitle>4. Official Google Material Symbols Rounded & Containers</CardTitle>
                <CardDescription>
                  Bộ icon chính thức của Material Design 3 bo tròn mềm mại, hỗ trợ chuyển đổi trạng thái Outlined và Filled (Tô đặc khi Active).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Outlined vs Filled comparison */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Chuyển đổi trạng thái (Outlined vs Filled)
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center gap-1.5 text-center">
                      <Icon name="dashboard" size={24} className="text-slate-700" />
                      <span className="text-[11px] text-slate-500">dashboard (Line)</span>
                    </div>
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col items-center gap-1.5 text-center">
                      <Icon name="dashboard" filled size={24} className="text-emerald-800" />
                      <span className="text-[11px] font-bold text-emerald-800">dashboard (Active)</span>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center gap-1.5 text-center">
                      <Icon name="group" size={24} className="text-slate-700" />
                      <span className="text-[11px] text-slate-500">group (Line)</span>
                    </div>
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col items-center gap-1.5 text-center">
                      <Icon name="group" filled size={24} className="text-emerald-800" />
                      <span className="text-[11px] font-bold text-emerald-800">group (Active)</span>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center gap-1.5 text-center">
                      <Icon name="task_alt" size={24} className="text-slate-700" />
                      <span className="text-[11px] text-slate-500">task_alt (Line)</span>
                    </div>
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col items-center gap-1.5 text-center">
                      <Icon name="task_alt" filled size={24} className="text-emerald-800" />
                      <span className="text-[11px] font-bold text-emerald-800">task_alt (Active)</span>
                    </div>
                  </div>
                </div>

                {/* Icon Containers */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Hộp chứa Tonal Icon Containers (M3 Standard)
                  </p>
                  <div className="flex flex-wrap items-center gap-4">
                    <IconContainer size="sm" variant="tonal">
                      <Icon name="event" size={16} />
                    </IconContainer>
                    <IconContainer size="md" variant="tonal">
                      <Icon name="event" size={20} />
                    </IconContainer>
                    <IconContainer size="lg" variant="tonal">
                      <Icon name="payments" size={24} />
                    </IconContainer>
                    <IconContainer size="xl" variant="primary">
                      <Icon name="stars" filled size={32} />
                    </IconContainer>
                    <IconContainer size="lg" variant="surface">
                      <Icon name="settings" size={24} />
                    </IconContainer>
                    <IconContainer size="lg" variant="outline">
                      <Icon name="folder" size={24} />
                    </IconContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* =========================================================================
              TAB 2: BUTTONS
             ========================================================================= */}
          <TabsContent value="buttons" className="space-y-6 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Button Variants & States</CardTitle>
                <CardDescription>
                  Các biến thể nút bấm M3 truyền tải phân cấp qua màu nền và typography thay vì đổ bóng dày.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Variants row */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Phân cấp hành động (Variants)
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button variant="default">
                      <Plus className="w-4 h-4 mr-1.5" />
                      Primary (Filled)
                    </Button>
                    <Button variant="secondary">Secondary (Tonal)</Button>
                    <Button variant="outline">Outlined</Button>
                    <Button variant="ghost">Ghost (Text)</Button>
                    <Button variant="destructive">
                      <Trash2 className="w-4 h-4 mr-1.5" />
                      Destructive
                    </Button>
                    <Button variant="success">
                      <CheckCircle2 className="w-4 h-4 mr-1.5" />
                      Success
                    </Button>
                  </div>
                </div>

                {/* Sizes row */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Kích cỡ (Sizes)
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button size="lg">Large (48px)</Button>
                    <Button size="default">Default (40px)</Button>
                    <Button size="sm">Small (36px)</Button>
                    <Button size="xs">Extra Small (30px)</Button>
                  </div>
                </div>

                {/* States row */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Trạng thái tương tác (States)
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button disabled>Disabled Button</Button>
                    <Button disabled variant="outline">Disabled Outline</Button>
                    <Button disabled className="cursor-wait">
                      <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                      Loading State...
                    </Button>
                  </div>
                </div>

                {/* Icon Buttons row */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Nút biểu tượng (Icon Buttons)
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <IconButton aria-label="Xem chi tiết" size="icon">
                      <Eye className="w-4 h-4" />
                    </IconButton>
                    <IconButton aria-label="Chỉnh sửa" size="icon-sm" variant="secondary">
                      <Edit2 className="w-3.5 h-3.5" />
                    </IconButton>
                    <IconButton aria-label="Xóa" size="icon-xs" variant="destructive">
                      <Trash2 className="w-3 h-3" />
                    </IconButton>
                    <IconButton aria-label="Tùy chọn khác" size="icon-sm" variant="outline">
                      <MoreVertical className="w-3.5 h-3.5" />
                    </IconButton>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* =========================================================================
              TAB 3: FORM CONTROLS
             ========================================================================= */}
          <TabsContent value="forms" className="space-y-6 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Form Controls & Inputs</CardTitle>
                <CardDescription>
                  Ô nhập liệu chuẩn M3 Outlined với focus ring kép xanh ngọc và các trạng thái đầy đủ.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Text Inputs */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Standard Input (Populated)
                    </label>
                    <Input defaultValue="Nguyễn Văn A" placeholder="Nhập họ và tên..." />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Search Input (Clearable)
                    </label>
                    <SearchInput
                      value={searchVal}
                      onChange={(e) => setSearchVal(e.target.value)}
                      onClear={() => setSearchVal("")}
                      placeholder="Tìm kiếm hội viên, MSSV..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Disabled Input
                    </label>
                    <Input disabled value="Không thể chỉnh sửa" />
                  </div>
                </div>

                {/* Select, Textarea, Selection Controls */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Select Picker (Radix UI)
                    </label>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn vai trò..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="leader">Chi hội trưởng / Chủ nhiệm</SelectItem>
                        <SelectItem value="deputy">Chi hội phó / Phó Chủ nhiệm</SelectItem>
                        <SelectItem value="treasurer">Thủ quỹ</SelectItem>
                        <SelectItem value="secretary">Thư ký</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Textarea (Min-height 80px)
                    </label>
                    <Textarea placeholder="Nhập nội dung ghi chú hoạt động..." />
                  </div>

                  <div className="pt-2 flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="chk-demo"
                        checked={checkboxChecked}
                        onCheckedChange={setCheckboxChecked}
                      />
                      <label htmlFor="chk-demo" className="text-xs font-medium text-slate-700 cursor-pointer">
                        M3 Checkbox ({checkboxChecked ? "Đã chọn" : "Bỏ chọn"})
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        id="sw-demo"
                        checked={switchChecked}
                        onCheckedChange={setSwitchChecked}
                      />
                      <label htmlFor="sw-demo" className="text-xs font-medium text-slate-700 cursor-pointer">
                        M3 Switch ({switchChecked ? "Bật" : "Tắt"})
                      </label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* =========================================================================
              TAB 4: SURFACES
             ========================================================================= */}
          <TabsContent value="surfaces" className="space-y-6 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle>Elevated Card</CardTitle>
                  <CardDescription>Bề mặt trắng với viền nhẹ và Level 1 shadow.</CardDescription>
                </CardHeader>
                <CardContent className="text-xs text-slate-600">
                  Dùng cho nội dung chính, danh sách thực thể, khối dữ liệu nghiệp vụ.
                </CardContent>
              </Card>

              <Card variant="tonal">
                <CardHeader>
                  <CardTitle>Tonal Card</CardTitle>
                  <CardDescription>Bề mặt nền Slate/Mint nhẹ nhàng.</CardDescription>
                </CardHeader>
                <CardContent className="text-xs text-slate-600">
                  Dùng cho khối tóm tắt phụ trợ, khu vực bộ lọc, hướng dẫn nhanh.
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardHeader>
                  <CardTitle>Outlined Card</CardTitle>
                  <CardDescription>Bề mặt có viền rõ nét không đổ bóng.</CardDescription>
                </CardHeader>
                <CardContent className="text-xs text-slate-600">
                  Dùng cho form con lồng nhau hoặc khối thông tin liên hệ.
                </CardContent>
              </Card>
            </div>

            {/* Interactive Dialog & Dropdown Demo */}
            <Card>
              <CardHeader>
                <CardTitle>Dialog Modal & Dropdown Menus</CardTitle>
                <CardDescription>
                  Cửa sổ bật M3 bo góc 28px kết hợp hiệu ứng kính mờ backdrop.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-4">
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="default">Mở Dialog Modal Thử Nghiệm</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Xác nhận Phê duyệt Hoạt động</DialogTitle>
                      <DialogDescription>
                        Bạn có chắc chắn muốn phê duyệt kế hoạch tổ chức hoạt động "Tình nguyện Mùa hè xanh 2026"?
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-2 text-xs text-slate-600">
                      <p>• Dự toán kinh phí: <strong>5,000,000 ₫</strong></p>
                      <p>• Số lượng hội viên dự kiến: <strong>45 người</strong></p>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDialogOpen(false)}>
                        Đóng
                      </Button>
                      <Button variant="default" onClick={() => setDialogOpen(false)}>
                        Xác nhận Phê duyệt
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      Mở Dropdown Menu
                      <MoreVertical className="w-4 h-4 ml-1.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem>
                      <Eye className="w-3.5 h-3.5 mr-2" />
                      Xem chi tiết
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit2 className="w-3.5 h-3.5 mr-2" />
                      Chỉnh sửa thông tin
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-rose-600">
                      <Trash2 className="w-3.5 h-3.5 mr-2" />
                      Xóa bản ghi
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon-sm">
                      <HelpCircle className="w-4 h-4 text-slate-500" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Tooltip hỗ trợ giải thích ký hiệu</p>
                  </TooltipContent>
                </Tooltip>
              </CardContent>
            </Card>
          </TabsContent>

          {/* =========================================================================
              TAB 5: DATA & TABLES
             ========================================================================= */}
          <TabsContent value="data" className="space-y-6 pt-4">
            {/* Badges & Status Chips */}
            <Card>
              <CardHeader>
                <CardTitle>Badges & Status Indicators</CardTitle>
                <CardDescription>
                  Nhãn trạng thái tích hợp chấm tròn nhận diện thị giác nhanh.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-3">
                <Badge variant="success" showDot>Đang hoạt động</Badge>
                <Badge variant="warning" showDot>Chờ phê duyệt</Badge>
                <Badge variant="destructive" showDot>Quá hạn</Badge>
                <Badge variant="info" showDot>Đã hoàn thành</Badge>
                <Badge variant="purple" showDot>Ban Chấp Hành</Badge>
                <Badge variant="secondary">Cựu hội viên</Badge>
                <Badge variant="outline">Nhiệm kỳ 2025-2026</Badge>
              </CardContent>
            </Card>

            {/* Table & Pagination */}
            <Card>
              <CardHeader>
                <CardTitle>Data Table & Reusable Pagination</CardTitle>
                <CardDescription>
                  Bảng dữ liệu M3 với header in hoa, hover state layer và phân trang chuẩn.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox />
                        </TableHead>
                        <TableHead>Họ và Tên</TableHead>
                        <TableHead>MSSV</TableHead>
                        <TableHead>Chức vụ / Vai trò</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead className="text-right">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          <Checkbox />
                        </TableCell>
                        <TableCell className="font-semibold text-slate-900">Nguyễn Văn An</TableCell>
                        <TableCell className="font-mono text-xs text-slate-600">B2101234</TableCell>
                        <TableCell>Chi hội trưởng</TableCell>
                        <TableCell>
                          <Badge variant="success" showDot>Hoạt động</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="xs">Xem</Button>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <Checkbox />
                        </TableCell>
                        <TableCell className="font-semibold text-slate-900">Trần Thị Bích</TableCell>
                        <TableCell className="font-mono text-xs text-slate-600">B2105678</TableCell>
                        <TableCell>Thủ quỹ</TableCell>
                        <TableCell>
                          <Badge variant="purple" showDot>BCH</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="xs">Xem</Button>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                <Pagination
                  currentPage={currentPage}
                  totalPages={8}
                  totalItems={78}
                  pageSize={10}
                  onPageChange={setCurrentPage}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* =========================================================================
              TAB 6: FEEDBACK
             ========================================================================= */}
          <TabsContent value="feedback" className="space-y-6 pt-4">
            {/* Semantic Alerts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Alert variant="info">
                <Info className="h-4 w-4" />
                <AlertTitle>Thông báo Hệ thống</AlertTitle>
                <AlertDescription>
                  Hạn nộp báo cáo tổng kết hoạt động quý 3 là trước ngày 30/09/2026.
                </AlertDescription>
              </Alert>

              <Alert variant="success">
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Thao tác Thành công</AlertTitle>
                <AlertDescription>
                  Đã đồng bộ thành công danh sách điểm danh từ Google Sheets.
                </AlertDescription>
              </Alert>

              <Alert variant="warning">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Cảnh báo Kế toán</AlertTitle>
                <AlertDescription>
                  Số dư quỹ hiện tại đang dưới mức an toàn tối thiểu (dưới 1,000,000 ₫).
                </AlertDescription>
              </Alert>

              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Lỗi Đồng bộ Dữ liệu</AlertTitle>
                <AlertDescription>
                  Không thể kết nối đến webhook Google Forms. Vui lòng kiểm tra lại URL.
                </AlertDescription>
              </Alert>
            </div>

            {/* Skeletons */}
            <Card>
              <CardHeader>
                <CardTitle>Skeleton Pulse Loading</CardTitle>
                <CardDescription>
                  Hiệu ứng chờ tải dữ liệu mô phỏng đúng cấu trúc nội dung thực tế.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Skeleton shape="circle" className="h-12 w-12" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-3 w-[180px]" />
                  </div>
                </div>
                <div className="space-y-2 pt-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </CardContent>
            </Card>

            {/* Empty State Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Empty State Component</CardTitle>
              </CardHeader>
              <CardContent>
                <EmptyState
                  icon={<Calendar className="w-5 h-5" />}
                  title="Chưa có hoạt động nào trong nhiệm kỳ"
                  description="Hãy tạo hoạt động đầu tiên để bắt đầu theo dõi tiến độ và điểm danh hội viên."
                  actionLabel="Tạo hoạt động mới"
                  onAction={() => alert("Action triggered")}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
