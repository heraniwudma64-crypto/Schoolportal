import React, { useEffect, useState } from 'react';
import { FiSend, FiUpload, FiFileText, FiCalendar, FiBookOpen } from 'react-icons/fi';
import { api } from '../../lib/api';
import { formatClassSection } from '../../lib/classSection';

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

  useEffect(() => {
    api.get<any[]>('/teachers/assignments').then((assignments) => {
      setTeachingAssignments(assignments);
      const first = assignments[0];
      if (first) setFormData((current) => ({ ...current, subjectId: first.subjectId, classSectionId: first.classSectionId }));
      setRecentPublications(assignments.map((item) => ({ id: item.id, title: item.title, targetClass: item.ClassSection?.name || item.targetClass || '', time: new Date(item.createdAt).toLocaleString(), submissions: item.submissions || [] })));
    });
  }, []);

  const loadSubmissions = async (id: string) => {
    try { setSelectedSubmissions(await api.get<any[]>(`/assignments/${id}/submissions`)); } catch (error: any) { alert(error.message || 'Could not load submissions'); }
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
                <button type="button" onClick={() => loadSubmissions(item.id)} className="mt-3 text-xs font-bold text-blue-800">View student responses ({item.submissions?.length || 0})</button>
              </div>
            ))}
          </div>
        </div>

        {selectedSubmissions.length > 0 && <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4"><h3 className="font-bold">Student responses</h3>{selectedSubmissions.map((submission) => <div key={submission.id} className="py-2 text-sm border-b border-blue-100">{submission.student?.firstName} {submission.student?.lastName} <span className="text-gray-500">submitted {new Date(submission.createdAt).toLocaleString()}</span></div>)}</div>}

      </div>
    </div>
  );
}
