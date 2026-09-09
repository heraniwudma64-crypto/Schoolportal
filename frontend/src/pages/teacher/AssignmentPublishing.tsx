import React, { useEffect, useState } from 'react';
import { FiSend, FiUpload, FiFileText, FiCalendar, FiBookOpen } from 'react-icons/fi';
import { api } from '../../lib/api';
import { formatClassSection } from '../../lib/classSection';
import ReviewSubmissionModal, { SubmissionReviewData } from '../../components/dashboard/ReviewSubmissionModal';

export default function PublishAssignmentPage() {
  const [formData, setFormData] = useState({
    subjectId: '',
    classSectionId: '',
    title: '',
    instructions: '',
    dueDate: '',
    attachmentUrl: '',
  });

  const [loading, setLoading] = useState(false);
  const [teachingAssignments, setTeachingAssignments] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  
  // Example recent publications data matching the design
  const [recentPublications, setRecentPublications] = useState<any[]>([]);
  const [selectedSubmissions, setSelectedSubmissions] = useState<any[]>([]);
  const [reviewSubmission, setReviewSubmission] = useState<SubmissionReviewData | null>(null);

  const fetchAssignments = () => {
    api.get<any[]>('/assignments/teacher').then((assignments) => {
      setRecentPublications(assignments.map((item) => ({
        id: item.id,
        title: item.title,
        subject: item.subject,
        targetClass: item.ClassSection?.name || item.targetClass || '',
        instructions: item.instructions || item.description || '',
        time: new Date(item.createdAt).toLocaleString(),
        submissions: item.submissions || [],
      })));
    }).catch(() => {});
  };

  useEffect(() => {
    api.get<any[]>('/teachers/assignments').then((assignments) => {
      setTeachingAssignments(assignments);
      const first = assignments[0];
      if (first) setFormData((current) => ({ ...current, subjectId: first.subjectId, classSectionId: first.classSectionId }));
    });
    fetchAssignments();
  }, []);

  const loadSubmissions = async (assignment: any) => {
    try {
      const subs = await api.get<any[]>(`/assignments/${assignment.id}/submissions`);
      setSelectedSubmissions(subs.map((s) => ({
        ...s,
        assignmentTitle: assignment.title,
        subject: assignment.subject || '',
        targetClass: assignment.targetClass || '',
        instructions: assignment.instructions || '',
      })));
    } catch (error: any) {
      alert(error.message || 'Could not load submissions');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const newAssignment = await api.post<any>('/assignments', {
          title: formData.title,
          subjectId: formData.subjectId,
          classSectionId: formData.classSectionId,
          description: formData.instructions,
          instructions: formData.instructions,
          dueDate: formData.dueDate,
          attachmentUrl: formData.attachmentUrl,
      });
      
      setRecentPublications([
        { id: newAssignment.id || Date.now(), title: formData.title, targetClass: formatClassSection(teachingAssignments.find((item) => item.classSectionId === formData.classSectionId)?.ClassSection).toUpperCase(), time: 'JUST NOW' },
        ...recentPublications,
      ]);

      setMessage('Assignment published successfully and distributed to enrolled students!');
      fetchAssignments();
      setFormData({
        subjectId: teachingAssignments[0]?.subjectId || '',
        classSectionId: teachingAssignments[0]?.classSectionId || '',
        title: '',
        instructions: '',
        dueDate: '',
        attachmentUrl: '',
      });
    } catch (error) {
      console.error(error);
      alert('Error publishing assignment. Ensure you are logged in and the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8 font-sans text-gray-800">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Publish Assignment</h1>
        <p className="text-sm text-gray-500 mt-1">Create and distribute new assignments to your classes.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: Form Card (Span 2) */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handlePublish} className="space-y-6">
            
            {/* Subject and Target Class Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Subject</label>
                <select
                  name="subjectId"
                  value={formData.subjectId}
                  onChange={(e) => {
                    const assignment = teachingAssignments.find((item) => item.subjectId === e.target.value);
                    setFormData({ ...formData, subjectId: e.target.value, classSectionId: assignment?.classSectionId || '' });
                  }}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                >
                  {[...new Map(teachingAssignments.map((item) => [item.Subject.id, item.Subject])).values()].map((subject: any) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Target Class</label>
                <select
                  name="classSectionId"
                  value={formData.classSectionId}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                >
                  {teachingAssignments.filter((item) => item.subjectId === formData.subjectId).map((item) => <option key={item.classSectionId} value={item.classSectionId}>{formatClassSection(item.ClassSection)}</option>)}
                </select>
              </div>
            </div>

            {/* Assignment Title */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Assignment Title</label>
              <input
                type="text"
                name="title"
                placeholder="e.g. Weekly Math Quiz - Algebra"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
              />
            </div>

            {/* Instructions / Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Instructions / Description</label>
              <textarea
                name="instructions"
                rows={5}
                placeholder="Provide detailed instructions for the students..."
                value={formData.instructions}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 resize-none"
              />
            </div>

            {/* Due Date and Attachment Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Due Date</label>
                <div className="relative">
                  <input
                    type="date"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleChange}
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Attachment</label>
                <label className="flex items-center justify-center gap-2 w-full bg-blue-50/50 border border-dashed border-blue-200 rounded-xl py-3 px-4 text-blue-600 text-sm font-semibold cursor-pointer hover:bg-blue-50 transition">
                  <FiUpload className="text-lg" />
                  <span>Upload File</span>
                  <input 
                    type="file" 
                    className="hidden" 
                    onChange={(e) => {
                      if(e.target.files?.[0]) {
                        setFormData({...formData, attachmentUrl: e.target.files[0].name});
                      }
                    }} 
                  />
                </label>
                {formData.attachmentUrl && (
                  <p className="text-xs text-gray-500 mt-1 truncate">Selected: {formData.attachmentUrl}</p>
                )}
              </div>
            </div>

            {/* Success Message Banner */}
            {message && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium">
                {message}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#142850] hover:bg-blue-950 text-white font-semibold py-4 rounded-xl shadow-lg shadow-blue-900/10 transition flex items-center justify-center gap-2 tracking-wide uppercase text-sm disabled:opacity-50"
            >
              <FiSend className="text-base" />
              <span>{loading ? 'Publishing Assignment...' : 'Publish Assignment'}</span>
            </button>

          </form>
        </div>

        {/* Right Column: Recent Publications Card (Span 1) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <FiFileText className="text-lg" />
            </div>
            <h2 className="font-bold text-gray-900 text-base">Recent Publications</h2>
          </div>

          <div className="space-y-4">
            {recentPublications.map((item) => (
              <div key={item.id} className="p-4 rounded-xl bg-gray-50/70 border border-gray-100 transition hover:bg-gray-50">
                <h3 className="font-bold text-gray-900 text-sm">{item.title}</h3>
                <p className="text-[11px] font-bold text-gray-400 tracking-wider mt-1">
                  {item.targetClass} • {item.time}
                </p>
                <button 
                  type="button" 
                  onClick={() => loadSubmissions(item)} 
                  className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-blue-800 hover:text-blue-950"
                >
                  View student responses ({item.submissions?.length || 0})
                </button>
              </div>
            ))}
            {recentPublications.length === 0 && (
              <p className="text-xs text-gray-400 italic">No published assignments yet.</p>
            )}
          </div>
        </div>

        {selectedSubmissions.length > 0 && (
          <div className="lg:col-span-3 mt-4 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-gray-900 text-base">
                  Student Responses: {selectedSubmissions[0]?.assignmentTitle}
                </h3>
                <p className="text-xs text-gray-500">
                  {selectedSubmissions[0]?.subject} {selectedSubmissions[0]?.targetClass ? `• ${selectedSubmissions[0]?.targetClass}` : ''} ({selectedSubmissions.length} submission{selectedSubmissions.length === 1 ? '' : 's'})
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedSubmissions([])} 
                className="text-xs text-gray-400 hover:text-gray-700 font-semibold"
              >
                Close list
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              {selectedSubmissions.map((submission) => {
                const isGraded = submission.grades && submission.grades.length > 0;
                return (
                  <div key={submission.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/50 p-2 rounded-xl transition">
                    <div>
                      <p className="font-bold text-sm text-gray-900">
                        {submission.student?.firstName} {submission.student?.lastName}
                        <span className="text-xs font-normal text-gray-400 ml-2">({submission.student?.admissionNo})</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Submitted: {new Date(submission.createdAt).toLocaleString()}
                        {submission.fileName ? ` • File: ${submission.fileName}` : ''}
                        {submission.content ? ' • Written answer provided' : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${isGraded ? 'bg-green-100 text-green-800' : 'bg-blue-50 text-blue-800'}`}>
                        {isGraded ? `Graded (${submission.grades[0].score}/${submission.grades[0].maxScore})` : 'Needs Review'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setReviewSubmission({
                          id: submission.id,
                          assignmentId: submission.assignmentId,
                          assignmentTitle: submission.assignmentTitle,
                          subject: submission.subject,
                          targetClass: submission.targetClass,
                          instructions: submission.instructions,
                          studentId: submission.student?.id || submission.studentId,
                          studentName: `${submission.student?.firstName || ''} ${submission.student?.lastName || ''}`.trim(),
                          admissionNo: submission.student?.admissionNo || '',
                          submittedAt: submission.createdAt,
                          content: submission.content || null,
                          fileName: submission.fileName || null,
                          fileUrl: submission.fileUrl || null,
                          fileSize: submission.fileSize || null,
                          isGraded,
                          grade: isGraded ? { score: submission.grades[0].score, maxScore: submission.grades[0].maxScore } : null,
                        })}
                        className="px-3 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold shadow-sm transition"
                      >
                        Open / Review Answer
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Review Submission Modal */}
        <ReviewSubmissionModal
          submission={reviewSubmission}
          isOpen={!!reviewSubmission}
          onClose={() => setReviewSubmission(null)}
          onGraded={(subId, score, maxScore) => {
            setSelectedSubmissions((prev) => prev.map((s) => s.id === subId ? {
              ...s,
              grades: [{ score, maxScore, id: 'graded' }],
            } : s));
            fetchAssignments();
          }}
        />
      </div>
    </div>
  );
}
