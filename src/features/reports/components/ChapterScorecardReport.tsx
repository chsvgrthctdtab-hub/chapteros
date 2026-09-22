import React, { useState, useMemo } from 'react';
import {
  Award,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Layers,
  Sparkles,
  TrendingUp,
  FolderOpen,
  Info,
  DollarSign,
  Users,
  CheckSquare,
} from 'lucide-react';
import { useActivitiesList } from '@/features/activities/queries/activity.queries';
import { useReportOverview, useReportMemberStats, useReportFundStats } from '../reports.queries';
import { parseActivityMetadata } from '@/features/activities/utils/activity-metadata';
import { LEAN_COMPETENCY_TAGS, type SemesterId } from '@/features/activities/types/competency.types';
import type { ReportFilterParams } from '@/types/report';
import { cn } from '@/lib/utils';

interface ChapterScorecardReportProps {
  organizationId?: string;
  filterParams: ReportFilterParams;
}

export function ChapterScorecardReport({
  organizationId,
  filterParams,
}: ChapterScorecardReportProps) {
  const [selectedSemester, setSelectedSemester] = useState<SemesterId | 'all'>('all');
  const [evidenceDriveUrl, setEvidenceDriveUrl] = useState<string>(
    localStorage.getItem(`chapteros_evidence_drive_${organizationId}`) || ''
  );
  const [isEditingDrive, setIsEditingDrive] = useState(false);
  const [tempDriveUrl, setTempDriveUrl] = useState(evidenceDriveUrl);

  // Expanded accordion sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    sec1: true,
    sec2: true,
    sec3: true,
    sec4: false,
    sec5: false,
  });

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Fetch all activities for the term
  const { data: activitiesData, isLoading: isActivitiesLoading } = useActivitiesList(
    organizationId,
    {
      termId: filterParams.termId,
      pageSize: 100,
    }
  );

  const { data: overview } = useReportOverview(organizationId, filterParams.termId);
  const { data: memberStats } = useReportMemberStats(organizationId, filterParams.termId);
  const { data: fundStats } = useReportFundStats(organizationId, filterParams);

  const allActivities = activitiesData?.data || [];

  // Filter activities by selected semester if applicable
  const activities = useMemo(() => {
    if (selectedSemester === 'all') return allActivities;
    return allActivities.filter((a) => {
      const meta = parseActivityMetadata(a.description);
      return meta.semester === selectedSemester;
    });
  }, [allActivities, selectedSemester]);

  // Handle saving Google Drive Evidence URL
  const handleSaveDriveUrl = () => {
    if (organizationId) {
      localStorage.setItem(`chapteros_evidence_drive_${organizationId}`, tempDriveUrl.trim());
    }
    setEvidenceDriveUrl(tempDriveUrl.trim());
    setIsEditingDrive(false);
  };

  // Calculate CTUMP 1.000-Point Criteria
  const scorecard = useMemo(() => {
    // 1. Công tác Tuyên truyền, Giáo dục & Xây dựng Hội (Max 250đ)
    const monthlyMeetings = activities.filter((a) => {
      const meta = parseActivityMetadata(a.description);
      return Boolean(meta.isMonthlyUnionMeeting);
    });
    const monthlyMeetingPoints = Math.min(monthlyMeetings.length * 50, 150);

    const politicalCampaigns = activities.filter((a) => a.category === 'academic' || a.category === 'general');
    const campaignPoints = politicalCampaigns.length > 0 ? 50 : 0;

    const totalMembers = memberStats?.totalMembers || overview?.memberCount || 0;
    const memberDevPoints = Math.min(totalMembers * 2, 50);

    const rawSec1 = monthlyMeetingPoints + campaignPoints + memberDevPoints;
    const sec1Max = 250;
    // 70% Cap rule: If monthly meetings < 1, cap at 70%
    const sec1HasPrereq = monthlyMeetings.length >= 1;
    const sec1Cap = sec1HasPrereq ? sec1Max : Math.floor(sec1Max * 0.7);
    const sec1Points = Math.min(rawSec1, sec1Cap);

    // 2. Phong trào Sinh viên 5 Tốt (Max 350đ)
    const sv5tActivities = activities.filter((a) => {
      const meta = parseActivityMetadata(a.description);
      return Boolean(meta.sv5tCriteria && meta.sv5tCriteria.length > 0);
    });
    const sv5tPromotionPoints = sv5tActivities.length > 0 ? 40 : 0;
    const sv5tCommendationPoints = 25; // Chi hội có tổ chức bình xét/tuyên dương
    const sv5tAchieversPoints = Math.min(sv5tActivities.length * 20, 235);
    const sv5tPartyReferralPoints = 50; // Giới thiệu đoàn viên/hội viên ưu tú

    const rawSec2 = sv5tPromotionPoints + sv5tCommendationPoints + sv5tAchieversPoints + sv5tPartyReferralPoints;
    const sec2Max = 350;
    const sec2HasPrereq = sv5tActivities.length >= 1;
    const sec2Cap = sec2HasPrereq ? sec2Max : Math.floor(sec2Max * 0.7);
    const sec2Points = Math.min(rawSec2, sec2Cap);

    // 3. Phong trào Sinh viên tình nguyện, Sáng tạo & Rèn luyện (Max 250đ)
    // Nhóm A (100đ): Chuẩn 2.2, 2.3, 1.1.1, 1.2.1/1.2.2
    const hasCareer = activities.some((a) => parseActivityMetadata(a.description).competencyTags?.includes('2.2_career'));
    const hasLifeSkills = activities.some((a) => parseActivityMetadata(a.description).competencyTags?.includes('2.3_lifeskills'));
    const hasForeignLang = activities.some((a) => parseActivityMetadata(a.description).competencyTags?.includes('1.1.1_foreign_language'));
    const hasSportsArts = activities.some((a) => {
      const tags = parseActivityMetadata(a.description).competencyTags || [];
      return tags.includes('1.2.1_sports') || tags.includes('1.2.2_arts_culture');
    });

    const groupAPoints = (hasCareer ? 25 : 0) + (hasLifeSkills ? 25 : 0) + (hasForeignLang ? 25 : 0) + (hasSportsArts ? 25 : 0);

    // Nhóm B (150đ): Tình nguyện hè MHX (60đ) + Tình nguyện cộng đồng thường xuyên Chuẩn 3.2
    const mhxActivities = activities.filter((a) => {
      const titleLower = a.title.toLowerCase();
      return titleLower.includes('mùa hè xanh') || titleLower.includes('xuân tình nguyện') || titleLower.includes('mhx');
    });
    const mhxPoints = mhxActivities.length > 0 ? 60 : 0;

    const volunteerActivities = activities.filter((a) => {
      const meta = parseActivityMetadata(a.description);
      return a.category === 'volunteer' || meta.competencyTags?.includes('3.2_community_volunteer');
    });

    let regularVolunteerPoints = 0;
    volunteerActivities.forEach((act) => {
      const meta = parseActivityMetadata(act.description);
      if (meta.activityScale === 'large') regularVolunteerPoints += 30;
      else if (meta.activityScale === 'medium') regularVolunteerPoints += 20;
      else regularVolunteerPoints += 10;
    });
    const groupBPoints = Math.min(mhxPoints + regularVolunteerPoints, 150);

    const rawSec3 = groupAPoints + groupBPoints;
    const sec3Max = 250;
    const sec3HasPrereq = volunteerActivities.length >= 1 && (hasCareer || hasLifeSkills);
    const sec3Cap = sec3HasPrereq ? sec3Max : Math.floor(sec3Max * 0.7);
    const sec3Points = Math.min(rawSec3, sec3Cap);

    // 4. Công tác Tài chính & Quản trị Quỹ (Max 100đ)
    const totalFunds = fundStats?.totalIncome || 0;
    const hasTransparentFunds = true; // ChapterOS stores real ledger
    const fundMgmtPoints = hasTransparentFunds ? 50 : 0;
    const fundRaisePoints = totalFunds > 0 ? 50 : 25;
    const rawSec4 = fundMgmtPoints + fundRaisePoints;
    const sec4Max = 100;
    const sec4Points = Math.min(rawSec4, sec4Max);

    // 5. Điểm Thưởng & Chuyển đổi số ChapterOS (Max 50đ)
    const digitalTransformationPoints = 30; // Using ChapterOS system
    const initiativePoints = activities.some((a) => parseActivityMetadata(a.description).organizerScope === 'collab') ? 20 : 10;
    const rawSec5 = digitalTransformationPoints + initiativePoints;
    const sec5Max = 50;
    const sec5Points = Math.min(rawSec5, sec5Max);

    // Total Score
    const totalScore = sec1Points + sec2Points + sec3Points + sec4Points + sec5Points;

    // Classification
    let rank = 'Trung bình';
    let rankColor = 'bg-slate-100 text-slate-800 border-slate-300';
    if (totalScore >= 900) {
      rank = 'Chi hội Xuất sắc';
      rankColor = 'bg-emerald-50 text-emerald-800 border-emerald-300';
    } else if (totalScore >= 800) {
      rank = 'Chi hội Tốt';
      rankColor = 'bg-[#e6f0ff] text-signal-blue border-[#d4e4fa]';
    } else if (totalScore >= 650) {
      rank = 'Chi hội Khá';
      rankColor = 'bg-amber-50 text-amber-800 border-amber-300';
    }

    return {
      totalScore,
      rank,
      rankColor,
      sec1: {
        points: sec1Points,
        max: sec1Max,
        raw: rawSec1,
        isCapped: !sec1HasPrereq,
        monthlyMeetings,
        monthlyMeetingPoints,
        campaignPoints,
        memberDevPoints,
      },
      sec2: {
        points: sec2Points,
        max: sec2Max,
        raw: rawSec2,
        isCapped: !sec2HasPrereq,
        sv5tActivities,
        sv5tPromotionPoints,
        sv5tCommendationPoints,
        sv5tAchieversPoints,
        sv5tPartyReferralPoints,
      },
      sec3: {
        points: sec3Points,
        max: sec3Max,
        raw: rawSec3,
        isCapped: !sec3HasPrereq,
        hasCareer,
        hasLifeSkills,
        hasForeignLang,
        hasSportsArts,
        groupAPoints,
        groupBPoints,
        mhxActivities,
        mhxPoints,
        volunteerActivities,
        regularVolunteerPoints,
      },
      sec4: {
        points: sec4Points,
        max: sec4Max,
        fundMgmtPoints,
        fundRaisePoints,
      },
      sec5: {
        points: sec5Points,
        max: sec5Max,
        digitalTransformationPoints,
        initiativePoints,
      },
    };
  }, [activities, memberStats, overview, fundStats]);

  return (
    <div className="space-y-6" id="chapter-scorecard-report">
      {/* 1. Scorecard Executive Banner & Gauge */}
      <div className="bg-white rounded-2xl border border-hairline p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-hairline pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#e6f0ff] text-signal-blue border border-[#d4e4fa]">
                <Award className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-ink-navy">
                Bảng Điểm Đánh Giá Thi Đua Chi Hội (Thang điểm 1.000)
              </h2>
            </div>
            <p className="text-xs text-slate-gray">
              Theo quy chế thi đua và phân loại Chi hội trực thuộc Hội Sinh viên Trường ĐH Y Dược Cần Thơ (CTUMP).
            </p>
          </div>

          {/* Semester Filter Pills */}
          <div className="flex items-center gap-1 bg-pebble p-1 rounded-xl border border-hairline shrink-0">
            <button
              type="button"
              onClick={() => setSelectedSemester('all')}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer',
                selectedSemester === 'all'
                  ? 'bg-white text-ink-navy shadow-xs border border-hairline'
                  : 'text-slate-gray hover:text-ink-navy'
              )}
            >
              Toàn nhiệm kỳ
            </button>
            <button
              type="button"
              onClick={() => setSelectedSemester('hk1')}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer',
                selectedSemester === 'hk1'
                  ? 'bg-white text-signal-blue shadow-xs border border-hairline font-bold'
                  : 'text-slate-gray hover:text-ink-navy'
              )}
            >
              Học kỳ I
            </button>
            <button
              type="button"
              onClick={() => setSelectedSemester('hk2')}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer',
                selectedSemester === 'hk2'
                  ? 'bg-white text-signal-blue shadow-xs border border-hairline font-bold'
                  : 'text-slate-gray hover:text-ink-navy'
              )}
            >
              Học kỳ II
            </button>
            <button
              type="button"
              onClick={() => setSelectedSemester('hk3')}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer',
                selectedSemester === 'hk3'
                  ? 'bg-white text-signal-blue shadow-xs border border-hairline font-bold'
                  : 'text-slate-gray hover:text-ink-navy'
              )}
            >
              Học kỳ III
            </button>
          </div>
        </div>

        {/* Live Score Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Score */}
          <div className="bg-cloud p-4 rounded-xl border border-hairline space-y-1">
            <span className="text-2xs font-bold uppercase tracking-wider text-mist-gray">Tổng điểm tự đánh giá</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-signal-blue tabular-nums">
                {scorecard.totalScore}
              </span>
              <span className="text-xs font-semibold text-slate-gray">/ 1.000 điểm</span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-pebble rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="h-full bg-signal-blue rounded-full transition-all duration-500"
                style={{ width: `${(scorecard.totalScore / 1000) * 100}%` }}
              />
            </div>
          </div>

          {/* Classification Rank */}
          <div className="bg-cloud p-4 rounded-xl border border-hairline space-y-1">
            <span className="text-2xs font-bold uppercase tracking-wider text-mist-gray">Xếp loại dự kiến</span>
            <div className="pt-1">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${scorecard.rankColor}`}>
                <Sparkles className="w-3.5 h-3.5" />
                {scorecard.rank}
              </span>
            </div>
            <p className="text-[11px] text-slate-gray mt-1">
              {scorecard.totalScore >= 900 ? 'Đủ điều kiện nhận Bằng khen Đoàn - Hội' : 'Cần bổ sung thêm hoạt động trọng tâm'}
            </p>
          </div>

          {/* Core Competencies Fulfilled */}
          <div className="bg-cloud p-4 rounded-xl border border-hairline space-y-1">
            <span className="text-2xs font-bold uppercase tracking-wider text-mist-gray">Chuẩn Năng Lực Hội Sinh Viên</span>
            <p className="text-lg font-bold text-ink-navy">
              {[
                scorecard.sec3.hasCareer,
                scorecard.sec3.hasLifeSkills,
                scorecard.sec3.hasForeignLang,
                scorecard.sec3.hasSportsArts,
                scorecard.sec3.volunteerActivities.length > 0,
              ].filter(Boolean).length} / 5 <span className="text-xs font-normal text-slate-gray">nhóm chuẩn</span>
            </p>
            <p className="text-[11px] text-slate-gray">Đã tích hợp trong các hoạt động</p>
          </div>

          {/* Google Drive Evidence Folder */}
          <div className="bg-cloud p-4 rounded-xl border border-hairline space-y-1">
            <span className="text-2xs font-bold uppercase tracking-wider text-mist-gray">Thư mục Minh chứng Hội Sinh viên</span>
            {isEditingDrive ? (
              <div className="space-y-1.5 pt-1">
                <input
                  type="text"
                  placeholder="https://drive.google.com/drive/folders/..."
                  value={tempDriveUrl}
                  onChange={(e) => setTempDriveUrl(e.target.value)}
                  className="w-full px-2 py-1 text-xs bg-white border border-hairline rounded focus:ring-1 focus:ring-signal-blue"
                />
                <div className="flex items-center gap-1 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsEditingDrive(false)}
                    className="px-2 py-0.5 text-[10px] text-slate-gray border border-hairline rounded bg-white hover:bg-pebble"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveDriveUrl}
                    className="px-2 py-0.5 text-[10px] text-white bg-signal-blue rounded font-semibold"
                  >
                    Lưu
                  </button>
                </div>
              </div>
            ) : evidenceDriveUrl ? (
              <div className="pt-1 flex items-center justify-between">
                <a
                  href={evidenceDriveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-signal-blue hover:underline truncate max-w-[140px]"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Mở Google Drive</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setTempDriveUrl(evidenceDriveUrl);
                    setIsEditingDrive(true);
                  }}
                  className="text-[10px] text-slate-gray hover:text-ink-navy underline"
                >
                  Đổi link
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingDrive(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-signal-blue hover:text-[#005be0] pt-1"
              >
                <span>+ Gắn link thư mục Drive</span>
              </button>
            )}
            <p className="text-[10px] text-slate-gray">Lưu trữ kế hoạch, quyết định & hình ảnh minh chứng</p>
          </div>
        </div>
      </div>

      {/* 2. Itemized Scorecard Breakdown (5 Sections) */}
      <div className="space-y-4">
        {/* Section 1 */}
        <div className="bg-white rounded-2xl border border-hairline shadow-xs overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('sec1')}
            className="w-full px-5 py-4 flex items-center justify-between bg-cloud/40 hover:bg-cloud/70 transition-colors text-left cursor-pointer"
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 bg-signal-blue text-white rounded">Mục I</span>
                <h3 className="text-sm font-bold text-ink-navy">
                  Công tác Tuyên truyền, Giáo dục & Xây dựng Tổ chức Hội
                </h3>
              </div>
              <p className="text-xs text-slate-gray">
                Sinh hoạt chi đoàn/chi hội định kỳ, học tập nghị quyết, quản lý hội viên.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-base font-bold text-signal-blue tabular-nums">
                  {scorecard.sec1.points}
                </span>
                <span className="text-xs font-semibold text-slate-gray"> / {scorecard.sec1.max}đ</span>
              </div>
              {expandedSections.sec1 ? <ChevronUp className="w-4 h-4 text-mist-gray" /> : <ChevronDown className="w-4 h-4 text-mist-gray" />}
            </div>
          </button>

          {expandedSections.sec1 && (
            <div className="p-5 border-t border-hairline space-y-4 text-xs">
              <div className="divide-y divide-hairline">
                {/* 1.1 */}
                <div className="py-2.5 flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <p className="font-bold text-ink-navy">
                      1.1 Tổ chức sinh hoạt Chi đoàn / Chi hội định kỳ hàng tháng (+50đ / lần, tối đa 150đ)
                    </p>
                    <p className="text-slate-gray">
                      Đã ghi nhận: {scorecard.sec1.monthlyMeetings.length} buổi sinh hoạt định kỳ.
                    </p>
                  </div>
                  <span className="font-bold text-ink-navy tabular-nums shrink-0">
                    +{scorecard.sec1.monthlyMeetingPoints}đ
                  </span>
                </div>

                {/* 1.2 */}
                <div className="py-2.5 flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <p className="font-bold text-ink-navy">
                      1.2 Triển khai các cuộc thi trực tuyến, tìm hiểu Nghị quyết, pháp luật (+50đ)
                    </p>
                    <p className="text-slate-gray">
                      Tham gia đầy đủ các cuộc vận động do Đoàn - Hội cấp trên phát động.
                    </p>
                  </div>
                  <span className="font-bold text-ink-navy tabular-nums shrink-0">
                    +{scorecard.sec1.campaignPoints}đ
                  </span>
                </div>

                {/* 1.3 */}
                <div className="py-2.5 flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <p className="font-bold text-ink-navy">
                      1.3 Quản lý hồ sơ hội viên và phát triển hội viên mới (+2đ / hội viên, tối đa 50đ)
                    </p>
                    <p className="text-slate-gray">
                      Hồ sơ hội viên được chuẩn hóa và quản lý số hóa trên ChapterOS.
                    </p>
                  </div>
                  <span className="font-bold text-ink-navy tabular-nums shrink-0">
                    +{scorecard.sec1.memberDevPoints}đ
                  </span>
                </div>
              </div>

              {scorecard.sec1.isCapped && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-amber-800 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>Quy tắc khống chế 70%: Chi hội cần tổ chức tối thiểu 1 buổi sinh hoạt định kỳ để đạt điểm tối đa của mục này.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section 2 */}
        <div className="bg-white rounded-2xl border border-hairline shadow-xs overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('sec2')}
            className="w-full px-5 py-4 flex items-center justify-between bg-cloud/40 hover:bg-cloud/70 transition-colors text-left cursor-pointer"
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 bg-signal-blue text-white rounded">Mục II</span>
                <h3 className="text-sm font-bold text-ink-navy">
                  Phong trào "Sinh viên 5 Tốt"
                </h3>
              </div>
              <p className="text-xs text-slate-gray">
                Tuyên truyền, phát động, khen thưởng và hỗ trợ hội viên phấn đấu đạt SV5T các cấp.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-base font-bold text-signal-blue tabular-nums">
                  {scorecard.sec2.points}
                </span>
                <span className="text-xs font-semibold text-slate-gray"> / {scorecard.sec2.max}đ</span>
              </div>
              {expandedSections.sec2 ? <ChevronUp className="w-4 h-4 text-mist-gray" /> : <ChevronDown className="w-4 h-4 text-mist-gray" />}
            </div>
          </button>

          {expandedSections.sec2 && (
            <div className="p-5 border-t border-hairline space-y-4 text-xs">
              <div className="divide-y divide-hairline">
                <div className="py-2.5 flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <p className="font-bold text-ink-navy">
                      2.1 Tổ chức tuyên truyền, phát động và hướng dẫn đăng ký phong trào SV5T (+40đ)
                    </p>
                    <p className="text-slate-gray">
                      Có {scorecard.sec2.sv5tActivities.length} hoạt động được gắn tiêu chí hỗ trợ SV5T.
                    </p>
                  </div>
                  <span className="font-bold text-ink-navy tabular-nums shrink-0">
                    +{scorecard.sec2.sv5tPromotionPoints}đ
                  </span>
                </div>

                <div className="py-2.5 flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <p className="font-bold text-ink-navy">
                      2.2 Tổ chức bình xét, khen thưởng hội viên đạt danh hiệu SV5T cấp Chi hội (+25đ)
                    </p>
                    <p className="text-slate-gray">Chi hội có kế hoạch biểu dương và động viên kịp thời.</p>
                  </div>
                  <span className="font-bold text-ink-navy tabular-nums shrink-0">
                    +{scorecard.sec2.sv5tCommendationPoints}đ
                  </span>
                </div>

                <div className="py-2.5 flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <p className="font-bold text-ink-navy">
                      2.3 Số lượng hội viên đạt danh hiệu SV5T các cấp (Tối đa 235đ)
                    </p>
                    <p className="text-slate-gray">
                      50đ / SV5T cấp TW; 20đ / SV5T cấp Thành phố; 10đ / SV5T cấp Trường.
                    </p>
                  </div>
                  <span className="font-bold text-ink-navy tabular-nums shrink-0">
                    +{scorecard.sec2.sv5tAchieversPoints}đ
                  </span>
                </div>

                <div className="py-2.5 flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <p className="font-bold text-ink-navy">
                      2.4 Giới thiệu đoàn viên, hội viên ưu tú cho Đảng / Đoàn cấp trên (+50đ)
                    </p>
                    <p className="text-slate-gray">Có danh sách bồi dưỡng cán bộ và hội viên ưu tú.</p>
                  </div>
                  <span className="font-bold text-ink-navy tabular-nums shrink-0">
                    +{scorecard.sec2.sv5tPartyReferralPoints}đ
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 3 */}
        <div className="bg-white rounded-2xl border border-hairline shadow-xs overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('sec3')}
            className="w-full px-5 py-4 flex items-center justify-between bg-cloud/40 hover:bg-cloud/70 transition-colors text-left cursor-pointer"
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 bg-signal-blue text-white rounded">Mục III</span>
                <h3 className="text-sm font-bold text-ink-navy">
                  Phong trào "Sinh viên Tình nguyện", "Sáng tạo & Học tập"
                </h3>
              </div>
              <p className="text-xs text-slate-gray">
                Bao gồm Chuẩn Năng Lực Hội Sinh Viên (Kỹ năng nghề nghiệp, Kỹ năng sống, Ngoại ngữ, Thể thao, Tình nguyện ngoài cộng đồng).
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-base font-bold text-signal-blue tabular-nums">
                  {scorecard.sec3.points}
                </span>
                <span className="text-xs font-semibold text-slate-gray"> / {scorecard.sec3.max}đ</span>
              </div>
              {expandedSections.sec3 ? <ChevronUp className="w-4 h-4 text-mist-gray" /> : <ChevronDown className="w-4 h-4 text-mist-gray" />}
            </div>
          </button>

          {expandedSections.sec3 && (
            <div className="p-5 border-t border-hairline space-y-4 text-xs">
              {/* Nhóm A */}
              <div className="p-3.5 bg-cloud rounded-xl border border-hairline space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-ink-navy">
                    Nhóm A: Hoạt động học thuật, kỹ năng, thể thao, văn nghệ (Tối đa 100đ)
                  </span>
                  <span className="font-bold text-signal-blue tabular-nums">
                    {scorecard.sec3.groupAPoints} / 100đ
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-hairline">
                    <span>Mã 2.2: Kỹ năng nghề nghiệp & việc làm</span>
                    <span className={scorecard.sec3.hasCareer ? 'text-emerald-700 font-bold' : 'text-slate-gray'}>
                      {scorecard.sec3.hasCareer ? '+25đ ✓' : '0đ'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-hairline">
                    <span>Mã 2.3: Kỹ năng sống & giao tiếp y khoa</span>
                    <span className={scorecard.sec3.hasLifeSkills ? 'text-emerald-700 font-bold' : 'text-slate-gray'}>
                      {scorecard.sec3.hasLifeSkills ? '+25đ ✓' : '0đ'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-hairline">
                    <span>Mã 1.1.1: Sân chơi ngoại ngữ Y khoa</span>
                    <span className={scorecard.sec3.hasForeignLang ? 'text-emerald-700 font-bold' : 'text-slate-gray'}>
                      {scorecard.sec3.hasForeignLang ? '+25đ ✓' : '0đ'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-hairline">
                    <span>Mã 1.2.1 / 1.2.2: Hội thao & Văn nghệ</span>
                    <span className={scorecard.sec3.hasSportsArts ? 'text-emerald-700 font-bold' : 'text-slate-gray'}>
                      {scorecard.sec3.hasSportsArts ? '+25đ ✓' : '0đ'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Nhóm B */}
              <div className="p-3.5 bg-cloud rounded-xl border border-hairline space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-ink-navy">
                    Nhóm B: Hoạt động tình nguyện vì cộng đồng (Tối đa 150đ)
                  </span>
                  <span className="font-bold text-signal-blue tabular-nums">
                    {scorecard.sec3.groupBPoints} / 150đ
                  </span>
                </div>
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-hairline">
                    <div>
                      <p className="font-semibold text-ink-navy">Tham gia Chiến dịch Mùa Hè Xanh / Xuân Tình Nguyện (+60đ)</p>
                      <p className="text-[11px] text-slate-gray">
                        Đã ghi nhận: {scorecard.sec3.mhxActivities.length} chiến dịch lớn trong năm.
                      </p>
                    </div>
                    <span className="font-bold text-emerald-700 shrink-0">+{scorecard.sec3.mhxPoints}đ</span>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-hairline">
                    <div>
                      <p className="font-semibold text-ink-navy">Tình nguyện cộng đồng thường xuyên (Chuẩn 3.2)</p>
                      <p className="text-[11px] text-slate-gray">
                        Quy mô Lớn (+30đ), Quy mô Vừa (+20đ), Quy mô Nhỏ (+10đ).
                      </p>
                    </div>
                    <span className="font-bold text-emerald-700 shrink-0">+{scorecard.sec3.regularVolunteerPoints}đ</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 4 */}
        <div className="bg-white rounded-2xl border border-hairline shadow-xs overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('sec4')}
            className="w-full px-5 py-4 flex items-center justify-between bg-cloud/40 hover:bg-cloud/70 transition-colors text-left cursor-pointer"
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 bg-signal-blue text-white rounded">Mục IV</span>
                <h3 className="text-sm font-bold text-ink-navy">
                  Công tác Quản trị Tài chính & Quỹ Chi hội
                </h3>
              </div>
              <p className="text-xs text-slate-gray">
                Minh bạch sổ quỹ thu chi, quản lý hội phí và xã hội hóa nguồn lực.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-base font-bold text-signal-blue tabular-nums">
                  {scorecard.sec4.points}
                </span>
                <span className="text-xs font-semibold text-slate-gray"> / {scorecard.sec4.max}đ</span>
              </div>
              {expandedSections.sec4 ? <ChevronUp className="w-4 h-4 text-mist-gray" /> : <ChevronDown className="w-4 h-4 text-mist-gray" />}
            </div>
          </button>

          {expandedSections.sec4 && (
            <div className="p-5 border-t border-hairline space-y-3 text-xs">
              <div className="divide-y divide-hairline">
                <div className="py-2.5 flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <p className="font-bold text-ink-navy">4.1 Quản lý thu chi minh bạch, cập nhật sổ quỹ điện tử (+50đ)</p>
                    <p className="text-slate-gray">Hệ thống quản lý tài chính ChapterOS tự động đồng bộ số dư.</p>
                  </div>
                  <span className="font-bold text-ink-navy tabular-nums shrink-0">+{scorecard.sec4.fundMgmtPoints}đ</span>
                </div>
                <div className="py-2.5 flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <p className="font-bold text-ink-navy">4.2 Vận động tài trợ, gây quỹ xã hội hóa cho phong trào (+50đ)</p>
                    <p className="text-slate-gray">Chi hội chủ động tạo nguồn kinh phí cho hoạt động chuyên môn.</p>
                  </div>
                  <span className="font-bold text-ink-navy tabular-nums shrink-0">+{scorecard.sec4.fundRaisePoints}đ</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 5 */}
        <div className="bg-white rounded-2xl border border-hairline shadow-xs overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('sec5')}
            className="w-full px-5 py-4 flex items-center justify-between bg-cloud/40 hover:bg-cloud/70 transition-colors text-left cursor-pointer"
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 bg-signal-blue text-white rounded">Mục V</span>
                <h3 className="text-sm font-bold text-ink-navy">
                  Điểm Thưởng, Sáng kiến & Chuyển đổi số ChapterOS
                </h3>
              </div>
              <p className="text-xs text-slate-gray">
                Ứng dụng công nghệ thông tin trong quản lý Chi hội và mô hình liên tịch sáng tạo.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-base font-bold text-signal-blue tabular-nums">
                  {scorecard.sec5.points}
                </span>
                <span className="text-xs font-semibold text-slate-gray"> / {scorecard.sec5.max}đ</span>
              </div>
              {expandedSections.sec5 ? <ChevronUp className="w-4 h-4 text-mist-gray" /> : <ChevronDown className="w-4 h-4 text-mist-gray" />}
            </div>
          </button>

          {expandedSections.sec5 && (
            <div className="p-5 border-t border-hairline space-y-3 text-xs">
              <div className="divide-y divide-hairline">
                <div className="py-2.5 flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <p className="font-bold text-ink-navy">5.1 Ứng dụng chuyển đổi số toàn diện trong quản lý Chi hội (+30đ)</p>
                    <p className="text-slate-gray">Sử dụng ChapterOS đồng bộ dữ liệu hội viên, nhiệm kỳ, hoạt động và nhiệm vụ.</p>
                  </div>
                  <span className="font-bold text-ink-navy tabular-nums shrink-0">+{scorecard.sec5.digitalTransformationPoints}đ</span>
                </div>
                <div className="py-2.5 flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <p className="font-bold text-ink-navy">5.2 Mô hình phối hợp liên tịch (Collab) hoặc sáng kiến mới (+20đ)</p>
                    <p className="text-slate-gray">Đồng tổ chức các sự kiện quy mô cùng Liên chi hội và CLB bạn.</p>
                  </div>
                  <span className="font-bold text-ink-navy tabular-nums shrink-0">+{scorecard.sec5.initiativePoints}đ</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
