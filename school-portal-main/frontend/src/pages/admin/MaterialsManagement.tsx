import React, { useState } from 'react';
import { FileText, Plus, Download, Trash2, Search, Filter, ShieldAlert, Book, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Toaster, toast } from 'sonner';

const MaterialsManagement = () => {
  const [materials, setMaterials] = useState([
    { id: 1, title: 'Student Handbook 2024', cat: 'rule', desc: 'Comprehensive guide to school policies and student conduct rules.', date: 'Jan 01, 2024' },
    { id: 2, title: 'Q2 Exam Timetable', cat: 'notice', desc: 'Official schedule for all grade levels for Quarter 2 exams.', date: 'May 10, 2024' },
    { id: 3, title: 'Math Formulas Library', cat: 'material', desc: 'A collection of all formulas required for high school mathematics.', date: 'Feb 15, 2024' },
  ]);
  const [isUploading, setIsUploading] = useState(false);
  const [newMaterial, setNewMaterial] = useState({ title: '', cat: 'material', desc: '' });

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    const material = {
      ...newMaterial,
      id: Date.now(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
    };
    setMaterials([material, ...materials]);
    setIsUploading(false);
    setNewMaterial({ title: '', cat: 'material', desc: '' });
    toast.success('Material uploaded successfully!');
  };

  const handleDelete = (id: number) => {
    setMaterials(materials.filter(m => m.id !== id));
    toast.success('Material deleted successfully');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900">Materials Management</h2>
        </div>
        <button
          onClick={() => setIsUploading(true)}
          className="flex items-center gap-3 px-6 py-3 bg-blue-900 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-blue-800 transition-colors shadow-lg shadow-blue-900/20"
        >
          <Plus className="w-4 h-4" />
          Upload New Material
        </button>
      </div>

      {isUploading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button onClick={() => setIsUploading(false)} className="absolute right-8 top-8 text-gray-400 hover:text-gray-900">
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-2xl font-black text-gray-900 mb-6">Upload Material</h3>
            <form onSubmit={handleUpload} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Title</label>
                <input
                  required
                  type="text"
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-blue-500/10"
                  placeholder="Enter material title"
                  value={newMaterial.title}
                  onChange={e => setNewMaterial({...newMaterial, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Category</label>
                <select
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-blue-500/10 appearance-none"
                  value={newMaterial.cat}
                  onChange={e => setNewMaterial({...newMaterial, cat: e.target.value})}
                >
                  <option value="material">Learning Material</option>
                  <option value="notice">School Notice</option>
                  <option value="rule">Rule &amp; Regulation</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Description</label>
                <textarea
                  required
                  rows={3}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-blue-500/10 resize-none"
                  placeholder="Brief description..."
                  value={newMaterial.desc}
                  onChange={e => setNewMaterial({...newMaterial, desc: e.target.value})}
                />
              </div>
              <button type="submit" className="w-full py-5 bg-blue-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-900/20">
                Confirm Upload
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search materials..."
            className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold transition-all"
          />
        </div>
        <div className="flex gap-4">
          <select className="bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold appearance-none min-w-[180px]">
            <option>All Categories</option>
            <option>School Notices</option>
            <option>Learning Materials</option>
            <option>Rules &amp; Regulations</option>
          </select>
          <button className="p-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-400 hover:text-blue-900 transition-all">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {materials.map((item) => (
          <div key={item.id} className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 group overflow-hidden hover:border-blue-900/20 transition-all flex flex-col">
            <div className={cn(
              "p-8 flex items-center gap-6",
              item.cat === 'rule' ? "bg-amber-50" : item.cat === 'notice' ? "bg-indigo-50" : "bg-blue-50"
            )}>
              <div className={cn(
                "w-16 h-16 rounded-[1.5rem] flex items-center justify-center shrink-0 shadow-lg shadow-black/5",
                item.cat === 'rule' ? "bg-amber-600 text-white" : item.cat === 'notice' ? "bg-indigo-600 text-white" : "bg-blue-600 text-white"
              )}>
                {item.cat === 'rule' ? <ShieldAlert className="w-8 h-8" /> : <Book className="w-8 h-8" />}
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 block mb-2">{item.cat}s</span>
                <h3 className="text-lg font-black text-gray-900 line-clamp-1">{item.title}</h3>
              </div>
            </div>

            <div className="p-8 flex-1 flex flex-col">
              <p className="text-sm text-gray-500 leading-relaxed mb-8 flex-1">
                {item.desc}
              </p>

              <div className="flex items-center justify-between pt-8 border-t border-gray-100">
                <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{item.date}</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => handleDelete(item.id)} className="p-3 bg-gray-50 text-gray-400 hover:text-red-600 rounded-xl transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => toast.info('PDF download will be available soon')} className="flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-800 transition-colors">
                    <Download className="w-3 h-3" />
                    Download
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Toaster position="top-right" />
    </div>
  );
};

export default MaterialsManagement;
