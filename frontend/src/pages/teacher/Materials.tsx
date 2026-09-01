import React, { useEffect, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { formatClassSection } from '../../lib/classSection';

type TeachingAssignment = { classSectionId: string; ClassSection: { id: string; name: string; GradeLevel?: { name: string } | null } };
type Material = { id: string; title: string; description?: string | null; fileName?: string | null; category?: string | null; createdAt?: string | null };

export default function TeacherMaterials() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [adminMaterials, setAdminMaterials] = useState<Material[]>([]);
  const [sections, setSections] = useState<TeachingAssignment[]>([]);
  const [title, setTitle] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const load = async () => {
    try {
      const [materialData, adminMaterialData, assignmentData] = await Promise.all([
        api.get<Material[]>('/materials'),
        api.get<Material[]>('/materials/admin/published').catch(() => []),
        api.get<TeachingAssignment[]>('/teachers/assignments'),
      ]);
      setMaterials(materialData);
      setAdminMaterials(Array.isArray(adminMaterialData) ? adminMaterialData : []);
      const uniqueSections = assignmentData.filter((item, index, all) => all.findIndex((candidate) => candidate.classSectionId === item.classSectionId) === index);
      setSections(uniqueSections);
      setSectionId((current) => current || uniqueSections[0]?.classSectionId || '');
    } catch (err) {
      console.error('Failed to load materials:', err);
      toast.error('Could not load materials');
    }
  };

  useEffect(() => { 
    load().catch(() => toast.error('Could not load materials')); 
  }, []);

  const download = async (id: string) => {
    try {
      const { url } = await api.get<{ url: string }>(`/materials/${id}/download`);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch { toast.error('Could not create the download link'); }
  };

  const upload = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title || !sectionId || !file) return toast.error('Choose a title, section, and file');
    const form = new FormData();
    form.append('title', title);
    form.append('category', 'material');
    form.append('target_role', 'student');
    form.append('classSectionId', sectionId);
    form.append('file', file);
    try {
      await api.post('/materials', form);
      setTitle(''); setFile(null);
      await load();
      toast.success('Material uploaded for the selected section');
    } catch (error: any) { toast.error(error.message || 'Upload failed'); }
  };

  return <div className="space-y-6 max-w-5xl mx-auto">
    <div><h2 className="text-2xl font-bold text-gray-900">Learning Materials</h2><p className="text-sm text-gray-500">Download administrator resources and share materials with your assigned sections.</p></div>
    <form onSubmit={upload} className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white border rounded-xl p-5">
      <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Material title" className="border rounded-lg px-3 py-2" />
      <select value={sectionId} onChange={(event) => setSectionId(event.target.value)} className="border rounded-lg px-3 py-2">{sections.map((section) => <option key={section.classSectionId} value={section.classSectionId}>{formatClassSection(section.ClassSection)}</option>)}</select>
      <input type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="border rounded-lg px-3 py-2" />
      <button className="bg-blue-900 text-white rounded-lg px-4 py-2 font-semibold flex items-center justify-center gap-2"><Upload className="w-4 h-4" />Upload for students</button>
    </form>

    {adminMaterials.length > 0 && (
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">📌 Admin Published Materials</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          {adminMaterials.map((material) => (
            <article key={material.id} className="bg-white border rounded-lg p-4">
              <p className="text-xs uppercase text-blue-600 font-bold">{material.category || 'Material'}</p>
              <h4 className="font-bold text-gray-900 mt-1">{material.title}</h4>
              <p className="text-sm text-gray-500 mt-2">{material.description}</p>
              <button 
                onClick={() => download(material.id)} 
                className="mt-3 text-blue-800 font-semibold flex gap-2 hover:text-blue-600"
              >
                <Download className="w-4 h-4" />{material.fileName || 'Download'}
              </button>
            </article>
          ))}
        </div>
      </div>
    )}

    <div>
      <h3 className="text-lg font-bold text-gray-900 mb-4">📚 Class Materials</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {materials.map((material) => (
          <article key={material.id} className="bg-white border rounded-xl p-5">
            <p className="text-xs uppercase text-gray-400">{material.category || 'Material'}</p>
            <h3 className="font-bold text-gray-900">{material.title}</h3>
            <p className="text-sm text-gray-500 mt-2">{material.description}</p>
            <button onClick={() => download(material.id)} className="mt-4 text-blue-800 font-semibold flex gap-2"><Download className="w-4 h-4" />{material.fileName || 'Download'}</button>
          </article>
        ))}
      </div>
    </div>
  </div>;
}
