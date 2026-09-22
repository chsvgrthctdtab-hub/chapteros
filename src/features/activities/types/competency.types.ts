export type SemesterId = 'hk1' | 'hk2' | 'hk3';

export interface TermSemesterConfig {
  id: SemesterId;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  weeks?: number;
  isCurrent?: boolean;
}

export type OrganizerScope = 'chapter' | 'collab' | 'university_faculty';

export interface OrganizerScopeMeta {
  id: OrganizerScope;
  label: string;
  badgeLabel: string;
  badgeClass: string;
  description: string;
}

export const ORGANIZER_SCOPES: Record<OrganizerScope, OrganizerScopeMeta> = {
  chapter: {
    id: 'chapter',
    label: 'Tự tổ chức cấp Chi hội',
    badgeLabel: 'Cấp Chi hội',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description: 'Hoạt động nội bộ do Chi hội trực tiếp lên kế hoạch và chủ trì',
  },
  collab: {
    id: 'collab',
    label: 'Phối hợp Liên tịch (Collab với Liên chi / CLB bạn)',
    badgeLabel: 'Liên tịch / Collab',
    badgeClass: 'bg-[#e6f0ff] text-signal-blue border-[#d4e4fa]',
    description: 'Đồng tổ chức cùng các Chi hội khác, Liên chi hội hoặc CLB chuyên môn',
  },
  university_faculty: {
    id: 'university_faculty',
    label: 'Tham gia sự kiện cấp Khoa / cấp Trường / Đoàn - Hội Trường',
    badgeLabel: 'Cấp Khoa / Trường',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    description: 'Chi hội cử đoàn hội viên tham gia sự kiện do cấp trên tổ chức',
  },
};

export type ActivityScale = 'large' | 'medium' | 'small';

export interface ActivityScaleMeta {
  id: ActivityScale;
  label: string;
  pointsHsV: number;
  badgeClass: string;
  description: string;
}

export const ACTIVITY_SCALES: Record<ActivityScale, ActivityScaleMeta> = {
  large: {
    id: 'large',
    label: 'Quy mô Lớn',
    pointsHsV: 30,
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    description: 'Trên 200 SV hoặc kinh phí >20 triệu / kéo dài >7 ngày',
  },
  medium: {
    id: 'medium',
    label: 'Quy mô Trung bình',
    pointsHsV: 20,
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    description: 'Từ 100 đến dưới 200 SV hoặc kinh phí >1 triệu',
  },
  small: {
    id: 'small',
    label: 'Quy mô Nhỏ',
    pointsHsV: 10,
    badgeClass: 'bg-cloud text-slate-gray border-hairline',
    description: 'Từ 10 đến dưới 100 SV hoặc kinh phí dưới 1 triệu / nội bộ',
  },
};

export type CompetencyTagKey =
  | '2.2_career'
  | '2.3_lifeskills'
  | '3.2_community_volunteer'
  | '1.1.1_foreign_language'
  | '1.1.2_tech_innovation'
  | '1.2.1_sports'
  | '1.2.2_arts_culture'
  | '3.1_youth_union_officer'
  | '2.1_academic_study';

export interface CompetencyTagMeta {
  key: CompetencyTagKey;
  code: string;
  name: string;
  category: 'skills' | 'community' | 'academic' | 'sports_arts';
  yearlyRequirement?: string;
  description: string;
  badgeClass: string;
}

export const LEAN_COMPETENCY_TAGS: Record<CompetencyTagKey, CompetencyTagMeta> = {
  '2.2_career': {
    key: '2.2_career',
    code: '2.2',
    name: 'Kỹ năng nghề nghiệp & Việc làm',
    category: 'skills',
    yearlyRequirement: '1 HĐ/năm',
    description: 'Kỹ năng làm việc nhóm, hướng nghiệp, khởi nghiệp Y Dược, ngày hội việc làm',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  '2.3_lifeskills': {
    key: '2.3_lifeskills',
    code: '2.3',
    name: 'Kỹ năng sống & Giao tiếp y khoa',
    category: 'skills',
    yearlyRequirement: '1 HĐ/năm',
    description: 'Hội thảo, sinh hoạt, tập huấn kỹ năng mềm, giao tiếp, sức khỏe tinh thần',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  '3.2_community_volunteer': {
    key: '3.2_community_volunteer',
    code: '3.2',
    name: 'Tình nguyện ngoài cộng đồng',
    category: 'community',
    yearlyRequirement: '2 HĐ/năm',
    description: 'Tình nguyện cộng đồng do đơn vị trong Trường tổ chức, Xuân Tình Nguyện, Mùa Hè Xanh',
    badgeClass: 'bg-[#e6f0ff] text-signal-blue border-[#d4e4fa]',
  },
  '1.1.1_foreign_language': {
    key: '1.1.1_foreign_language',
    code: '1.1.1',
    name: 'Sân chơi & Giao lưu Ngoại ngữ',
    category: 'academic',
    yearlyRequirement: '3 HK',
    description: 'CLB tiếng Anh, chuyên đề ngoại ngữ Y khoa, giao lưu quốc tế, hội thảo quốc tế',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  '1.1.2_tech_innovation': {
    key: '1.1.2_tech_innovation',
    code: '1.1.2',
    name: 'Ứng dụng Công nghệ & Số hóa',
    category: 'academic',
    description: 'Thiết kế sản phẩm công nghệ, video thực hành, phần mềm y học (SPSS, EndNote, v.v.)',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
  },
  '1.2.1_sports': {
    key: '1.2.1_sports',
    code: '1.2.1',
    name: 'Hội thao & Rèn luyện Thể lực',
    category: 'sports_arts',
    description: 'Giải thể thao cấp Khoa/Trường, Thanh niên khỏe, CLB thể thao',
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  '1.2.2_arts_culture': {
    key: '1.2.2_arts_culture',
    code: '1.2.2',
    name: 'Văn hóa - Văn nghệ & Thẩm mỹ',
    category: 'sports_arts',
    description: 'Hội diễn văn nghệ, CLB kỹ năng/văn nghệ, khóa đào tạo ngắn',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  '3.1_youth_union_officer': {
    key: '3.1_youth_union_officer',
    code: '3.1',
    name: 'Cán bộ / CTV Đoàn - Hội',
    category: 'community',
    yearlyRequirement: '3 HK',
    description: 'Thành viên Ban Chấp Hành Chi hội, CTV Ban chuyên trách Đoàn - Hội',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  '2.1_academic_study': {
    key: '2.1_academic_study',
    code: '2.1',
    name: 'Kỹ năng học tập & NCKH',
    category: 'skills',
    description: 'Sinh hoạt học thuật, tuần sinh hoạt chính trị sinh viên, đề tài NCKH/bài báo',
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-200',
  },
};

export type SV5TCriterionKey =
  | 'dao_duc_tot'
  | 'hoc_tap_tot'
  | 'the_luc_tot'
  | 'tinh_nguyen_tot'
  | 'hoi_nhap_tot';

export interface SV5TCriterionMeta {
  key: SV5TCriterionKey;
  label: string;
  iconName: string;
  badgeClass: string;
}

export const SV5T_CRITERIA: Record<SV5TCriterionKey, SV5TCriterionMeta> = {
  dao_duc_tot: {
    key: 'dao_duc_tot',
    label: 'Đạo đức tốt',
    iconName: 'Shield',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  hoc_tap_tot: {
    key: 'hoc_tap_tot',
    label: 'Học tập tốt',
    iconName: 'BookOpen',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  the_luc_tot: {
    key: 'the_luc_tot',
    label: 'Thể lực tốt',
    iconName: 'Activity',
    badgeClass: 'bg-orange-50 text-orange-800 border-orange-200',
  },
  tinh_nguyen_tot: {
    key: 'tinh_nguyen_tot',
    label: 'Tình nguyện tốt',
    iconName: 'Heart',
    badgeClass: 'bg-[#e6f0ff] text-signal-blue border-[#d4e4fa]',
  },
  hoi_nhap_tot: {
    key: 'hoi_nhap_tot',
    label: 'Hội nhập tốt',
    iconName: 'Globe',
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
  },
};

export interface ActivityMetadata {
  semester?: SemesterId;
  organizerScope?: OrganizerScope;
  activityScale?: ActivityScale;
  competencyTags?: CompetencyTagKey[];
  sv5tCriteria?: SV5TCriterionKey[];
  isMonthlyUnionMeeting?: boolean;
  estimatedBudget?: number;
}
