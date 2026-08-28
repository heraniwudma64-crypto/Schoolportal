import React, { useState } from 'react';
import { FiSend, FiUpload, FiFileText, FiCalendar, FiBookOpen } from 'react-icons/fi';

export default function PublishAssignmentPage() {
  const [formData, setFormData] = useState({
    subject: 'Mathematics',
    targetClass: 'Grade 10A',
    title: '',
    instructions: '',
    dueDate: '',
    attachmentUrl: '',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // Example recent publications data matching the design
  const [recentPublications, setRecentPublications] = useState([
    { id: 1, title: 'Algebra Worksheet', targetClass: 'GRADE 10A', time: '2 HOURS AGO' },
    { id: 2, title: 'Physics Lab Report', targetClass: 'GRADE 10B', time: 'YESTERDAY' },
  ]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Get the stored auth token and user info if available
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : {};

      const response = await fetch('http://localhost:3000/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title: formData.title,
          subject: formData.subject,
          targetClass: formData.targetClass,
          description: formData.instructions,
          instructions: formData.instructions,
          dueDate: formData.dueDate,
          attachmentUrl: formData.attachmentUrl,
          userId: user.id || user.sub, // Send real user ID so backend can find the teacher profile
        }),
      });

      if (!response.ok) throw new Error('Failed to publish assignment');

      const newAssignment = await response.json();
      
      setRecentPublications([
        { id: newAssignment.id || Date.now(), title: formData.title, targetClass: formData.targetClass.toUpperCase(), time: 'JUST NOW' },
        ...recentPublications,
      ]);

      setMessage('Assignment published successfully and distributed to enrolled students!');
      setFormData({
        subject: 'Mathematics',
        targetClass: 'Grade 10A',
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
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                >
                  <option value="Mathematics">Mathematics</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="English">English</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Target Class</label>
                <select
                  name="targetClass"
                  value={formData.targetClass}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                >
                  <option value="Grade 10A">Grade 10A</option>
                  <option value="Grade 10B">Grade 10B</option>
                  <option value="Grade 11A">Grade 11A</option>
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
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}