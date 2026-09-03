import React, { useState, useEffect, useCallback } from 'react';
import {
  Video,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  X,
  ExternalLink,
  BookOpen,
  Users,
  RefreshCw,
  AlertCircle,
  MessageSquare,
  Trash2,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  EducationalVideo,
  VideoStatus,
  getAdminVideos,
  reviewVideo,
  deleteVideo,
} from '../../api/videos';

export default function AdminVideoReview() {
  const [videos, setVideos] = useState<EducationalVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING_APPROVAL');
  const [searchQuery, setSearchQuery] = useState('');

  // Player & Reject Modals
  const [playingVideo, setPlayingVideo] = useState<EducationalVideo | null>(null);
  const [rejectingVideo, setRejectingVideo] = useState<EducationalVideo | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const loadVideos = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAdminVideos(activeTab);
      setVideos(data);
    } catch (err: any) {
      toast.error('Failed to load video submissions: ' + (err?.message || 'Error'));
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  const handleApprove = async (video: EducationalVideo) => {
    if (!window.confirm(`Approve and release "${video.title}" to students?`)) {
      return;
    }
    setIsProcessing(true);
    try {
      await reviewVideo(video.id, { status: 'APPROVED' });
      toast.success(`"${video.title}" approved and published to students!`);
      await loadVideos();
    } catch (err: any) {
      toast.error('Failed to approve video: ' + (err?.message || 'Error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenRejectModal = (video: EducationalVideo) => {
    setRejectingVideo(video);
    setRejectionReason('');
  };

  const handleConfirmReject = async () => {
    if (!rejectingVideo) return;
    setIsProcessing(true);
    try {
      await reviewVideo(rejectingVideo.id, {
        status: 'REJECTED',
        rejectionReason: rejectionReason.trim() || 'Content did not meet curriculum guidelines.',
      });
      toast.success(`Video submission rejected.`);
      setRejectingVideo(null);
      await loadVideos();
    } catch (err: any) {
      toast.error('Failed to reject video: ' + (err?.message || 'Error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (video: EducationalVideo) => {
    if (!window.confirm(`Delete "${video.title}" permanently?`)) return;
    try {
      await deleteVideo(video.id);
      toast.success('Video deleted.');
      await loadVideos();
    } catch (err: any) {
      toast.error('Failed to delete video: ' + (err?.message || 'Error'));
    }
  };

  const filteredVideos = videos.filter((v) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = v.title.toLowerCase().includes(q);
      const teacherMatch = `${v.Teacher?.firstName} ${v.Teacher?.lastName}`.toLowerCase().includes(q);
      const subjectMatch = (v.Subject?.name || '').toLowerCase().includes(q);
      return titleMatch || teacherMatch || subjectMatch;
    }
    return true;
  });

  const pendingCount = videos.filter((v) => v.status === 'PENDING_APPROVAL').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-950 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-bold mb-2">
            <Video className="w-4 h-4 text-red-400" />
            Admin Media Vetting
          </div>
          <h2 className="text-2xl md:text-3xl font-black">YouTube Video Approvals</h2>
          <p className="text-xs md:text-sm text-blue-100/80 mt-1 max-w-xl">
            Review and vet educational YouTube media submitted by teachers before release to enrolled students.
          </p>
        </div>

        {pendingCount > 0 && (
          <div className="px-5 py-3 rounded-2xl bg-amber-500/20 border border-amber-400/30 text-amber-200 text-xs font-bold flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>{pendingCount} submission{pendingCount === 1 ? '' : 's'} awaiting your review</span>
          </div>
        )}
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-2xl border border-gray-200 shadow-sm text-xs font-bold">
          <button
            onClick={() => setActiveTab('PENDING_APPROVAL')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'PENDING_APPROVAL'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-amber-700'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Pending Approval
          </button>
          <button
            onClick={() => setActiveTab('APPROVED')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'APPROVED'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-emerald-700'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approved Media
          </button>
          <button
            onClick={() => setActiveTab('REJECTED')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'REJECTED'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-rose-700'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            Rejected
          </button>
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              activeTab === 'ALL'
                ? 'bg-blue-900 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All Submissions
          </button>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search title, teacher, subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <button
            onClick={loadVideos}
            disabled={isLoading}
            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors shrink-0"
            title="Refresh submissions"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Submissions List */}
      {isLoading ? (
        <div className="py-20 text-center space-y-3 bg-white rounded-3xl border border-gray-100">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-gray-500">Loading video submissions...</p>
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-gray-200 p-8 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-gray-900 text-base">No video submissions in this view</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            {activeTab === 'PENDING_APPROVAL'
              ? 'Great job! There are no pending teacher videos awaiting admin review.'
              : 'No videos found matching the selected filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredVideos.map((video) => {
            const isPending = video.status === 'PENDING_APPROVAL';
            const isApproved = video.status === 'APPROVED';
            const isRejected = video.status === 'REJECTED';

            return (
              <div
                key={video.id}
                className="bg-white rounded-3xl border border-gray-100 p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row items-start gap-6"
              >
                {/* Thumbnail / Video preview button */}
                <div
                  className="relative w-full md:w-64 aspect-video rounded-2xl overflow-hidden bg-gray-950 cursor-pointer group shrink-0 shadow-sm"
                  onClick={() => setPlayingVideo(video)}
                >
                  <img
                    src={
                      video.thumbnailUrl ||
                      `https://img.youtube.com/vi/${video.youtubeVideoId}/hqdefault.jpg`
                    }
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <div className="w-11 h-11 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 fill-white ml-0.5" />
                    </div>
                  </div>
                  <span className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                    Click to Preview
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Status Pill */}
                    {isPending && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Awaiting Review
                      </span>
                    )}
                    {isApproved && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Released to Students
                      </span>
                    )}
                    {isRejected && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> Rejected
                      </span>
                    )}

                    {/* Subject & Section Badges */}
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-800 border border-blue-100 flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {video.Subject?.name}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-800 border border-purple-100 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {video.ClassSection?.name ? `${video.ClassSection.name}` : 'All Sections'}
                    </span>
                  </div>

                  <h3 className="font-bold text-gray-900 text-lg leading-snug">{video.title}</h3>

                  {video.description && (
                    <p className="text-xs text-gray-600 line-clamp-2">{video.description}</p>
                  )}

                  {/* Teacher Information & Submission date */}
                  <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                    <div>
                      <span className="font-bold text-gray-700">Teacher: </span>
                      {video.Teacher?.firstName} {video.Teacher?.lastName}
                      {video.Teacher?.staffId ? ` (${video.Teacher.staffId})` : ''}
                    </div>
                    <div>
                      <span className="font-bold text-gray-700">Submitted: </span>
                      {video.submittedAt ? new Date(video.submittedAt).toLocaleDateString() : new Date(video.createdAt).toLocaleDateString()}
                    </div>
                    <a
                      href={video.youtubeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 hover:underline"
                    >
                      Open YouTube Link <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* Rejection notice if present */}
                  {isRejected && video.rejectionReason && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900">
                      <span className="font-bold">Rejection Reason: </span>
                      {video.rejectionReason}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex md:flex-col items-center gap-2 shrink-0 self-end md:self-center w-full md:w-auto justify-end">
                  {isPending && (
                    <>
                      <button
                        onClick={() => handleApprove(video)}
                        disabled={isProcessing}
                        className="flex-1 md:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Approve
                      </button>
                      <button
                        onClick={() => handleOpenRejectModal(video)}
                        disabled={isProcessing}
                        className="flex-1 md:flex-none px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                    </>
                  )}

                  {isApproved && (
                    <button
                      onClick={() => handleOpenRejectModal(video)}
                      disabled={isProcessing}
                      className="px-4 py-2 text-gray-500 hover:text-rose-700 text-xs font-bold transition-colors"
                      title="Revoke / Reject"
                    >
                      Revoke Approval
                    </button>
                  )}

                  {isRejected && (
                    <button
                      onClick={() => handleApprove(video)}
                      disabled={isProcessing}
                      className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors"
                    >
                      Re-Approve
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(video)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal: Reject Video with Reason ───────────────────────────────────── */}
      {rejectingVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-lg overflow-hidden">
            <div className="p-6 bg-rose-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-6 h-6" />
                <h3 className="font-black text-lg">Reject Video Submission</h3>
              </div>
              <button
                onClick={() => setRejectingVideo(null)}
                className="p-1 text-rose-200 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-700">
                You are rejecting{' '}
                <strong className="text-gray-900">&ldquo;{rejectingVideo.title}&rdquo;</strong>.
                Provide feedback or instructions for the teacher on why this content was rejected.
              </p>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-gray-600 mb-1.5">
                  Rejection Reason / Guidance
                </label>
                <textarea
                  rows={4}
                  placeholder="e.g., Video quality is insufficient, please select an alternate lecture with full audio clarity..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none"
                />
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setRejectingVideo(null)}
                className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-xs font-black uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={isProcessing}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-rose-600/20 disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: YouTube Video Player Preview ──────────────────────────────── */}
      {playingVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-950 rounded-3xl border border-gray-800 w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 bg-gray-900/80 border-b border-gray-800 text-white flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-gray-100 truncate max-w-lg">
                  {playingVideo.title}
                </h4>
                <p className="text-[11px] text-gray-400">
                  {playingVideo.Subject?.name} &bull; Submitted by{' '}
                  {playingVideo.Teacher?.firstName} {playingVideo.Teacher?.lastName}
                </p>
              </div>
              <button
                onClick={() => setPlayingVideo(null)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-video w-full bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${playingVideo.youtubeVideoId}?autoplay=1&rel=0`}
                title={playingVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>

            {playingVideo.description && (
              <div className="p-4 bg-gray-900 text-xs text-gray-300 border-t border-gray-800">
                <p className="font-bold text-gray-400 uppercase tracking-wider text-[10px] mb-1">
                  Teacher Notes
                </p>
                <p>{playingVideo.description}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
