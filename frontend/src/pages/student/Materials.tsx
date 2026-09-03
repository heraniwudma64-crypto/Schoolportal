import React, { useState } from 'react';
import { MOCK_MATERIALS } from '../../data/mockData';
import { FileText, Download, ShieldAlert, Book, Video } from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import StudentVideoLessons from '../../components/dashboard/StudentVideoLessons';

const Materials = () => {
  const [mainTab, setMainTab] = useState<'documents' | 'videos'>('documents');
  const [docFilter, setDocFilter] = useState('All');

  const filteredMock = MOCK_MATERIALS.filter((m) => {
    if (docFilter === 'All') return true;
    if (docFilter === 'Rules') return m.category === 'rule';
    if (docFilter === 'Materials') return m.category === 'material';
    if (docFilter === 'Notices') return m.category === 'notice';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header and Main Tab Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Learning Materials & Video Lessons</h2>
          <p className="text-xs sm:text-sm text-gray-500">
            Access study documents, school guidelines, and teacher-curated educational YouTube videos.
          </p>
        </div>

        <div className="flex items-center bg-gray-100 p-1 rounded-2xl text-xs font-black shadow-inner">
          <button
            onClick={() => setMainTab('documents')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              mainTab === 'documents'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <FileText className="w-4 h-4 text-blue-600" />
            Study Documents
          </button>
          <button
            onClick={() => setMainTab('videos')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              mainTab === 'videos'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Video className="w-4 h-4" />
            Video Lessons
          </button>
        </div>
      </div>

      {mainTab === 'videos' ? (
        <StudentVideoLessons showHeader={false} />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-800">Reading & Rule Documents</h3>
            <div className="flex gap-2">
              {['All', 'Notices', 'Materials', 'Rules'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setDocFilter(filter)}
                  className={cn(
                    'px-4 py-1.5 text-xs font-bold rounded-xl transition-colors',
                    docFilter === filter
                      ? 'bg-blue-900 text-white'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50',
                  )}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMock.map((material) => (
              <div
                key={material.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col"
              >
                <div
                  className={cn(
                    'p-6 flex items-center gap-4',
                    material.category === 'rule' ? 'bg-amber-50' : 'bg-blue-50',
                  )}
                >
                  <div
                    className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
                      material.category === 'rule' ? 'bg-amber-600 text-white' : 'bg-blue-600 text-white',
                    )}
                  >
                    {material.category === 'rule' ? (
                      <ShieldAlert className="w-6 h-6" />
                    ) : (
                      <Book className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">
                      {material.category}
                    </span>
                    <h3 className="font-bold text-gray-900 line-clamp-1">{material.title}</h3>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <p className="text-sm text-gray-500 mb-6 flex-1">{material.description}</p>

                  <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                    <span className="text-xs text-gray-400 font-medium">{material.date}</span>
                    <button
                      onClick={() => toast.info('PDF download will be available soon')}
                      className="flex items-center gap-2 text-sm font-bold text-blue-900 hover:text-blue-700 transition-colors group"
                    >
                      <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                      Download PDF
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Materials;
