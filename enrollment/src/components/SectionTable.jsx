import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../lib/axios';

function SectionTable({ sections = [], irregularMax = 0, onUpdateSection, onDeleteSection, deleteMode = false }) {
    const [selectedSection, setSelectedSection] = useState(null);
    const [editingIrregular, setEditingIrregular] = useState(null);
    const [irregularValue, setIrregularValue] = useState(0);
    const [editingCapacity, setEditingCapacity] = useState(null);
    const [capacityMode, setCapacityMode] = useState('auto');
    const [capacityTotal, setCapacityTotal] = useState(50);
    const [manualRegular, setManualRegular] = useState(40);
    const [manualIrregular, setManualIrregular] = useState(10);
    const [saving, setSaving] = useState(false);
    const [selectedCurriculumSubjects, setSelectedCurriculumSubjects] = useState([]);
    const [curriculumLoading, setCurriculumLoading] = useState(false);
    const [curriculumError, setCurriculumError] = useState('');
    const [curriculumCache, setCurriculumCache] = useState({});
    const [sectionToDelete, setSectionToDelete] = useState(null);
    const [deleteSubmitting, setDeleteSubmitting] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    const normalizeYearKey = (year) => {
        const raw = String(year ?? '').trim().toLowerCase();
        const map = {
            '1': '1st',
            '1st': '1st',
            first: '1st',
            'first year': '1st',
            '2': '2nd',
            '2nd': '2nd',
            second: '2nd',
            'second year': '2nd',
            '3': '3rd',
            '3rd': '3rd',
            third: '3rd',
            'third year': '3rd',
            '4': '4th',
            '4th': '4th',
            fourth: '4th',
            'fourth year': '4th',
        };

        return map[raw] || null;
    };

    const getSemesterIndex = (semester) => {
        const raw = String(semester ?? '').trim().toLowerCase();

        if (['1', '1st', 'first', 'first semester', '1st semester'].includes(raw)) {
            return 0;
        }

        if (['2', '2nd', 'second', 'second semester', '2nd semester'].includes(raw)) {
            return 1;
        }

        return -1;
    };

    const getStatusStyle = (status) => {
        if (status === 'Available') {
            return 'bg-green-100 text-green-700 font-bold';
        }
        if (status === 'Full') {
            return 'bg-yellow-100 text-yellow-700 font-bold';
        }
        return 'bg-red-100 text-red-700 font-bold';
    };

    const getCapacityColorStyle = (actual, capacity) => {
        const actualNum = Number(actual || 0);
        const capacityNum = Number(capacity || 0);
        
        if (actualNum < capacityNum) {
            return 'text-green-600 font-semibold';
        }
        if (actualNum === capacityNum) {
            return 'text-yellow-600 font-semibold';
        }
        return 'text-red-600 font-semibold';
    };

    const openIrregularEditor = (section) => {
        setEditingIrregular(section);
        setIrregularValue(Number(section.irregular || 0));
    };

    const openCapacityEditor = (section) => {
        setEditingCapacity(section);
        setCapacityMode('auto');
        setCapacityTotal(Number(section.total_capacity || 50));
        setManualRegular(Number(section.regular_capacity || 40));
        setManualIrregular(Number(section.irregular_capacity || 10));
    };

    const handleSaveIrregular = async () => {
        if (!editingIrregular || !onUpdateSection) return;
        const next = Math.max(0, Math.min(Number(irregularMax || 0), Number(irregularValue || 0)));
        try {
            setSaving(true);
            await onUpdateSection(editingIrregular._id, { irregular: next });
            setEditingIrregular(null);
        } finally {
            setSaving(false);
        }
    };

    const handleSaveCapacity = async () => {
        if (!editingCapacity || !onUpdateSection) return;

        let payload;
        if (capacityMode === 'auto') {
            const total = Math.max(20, Number(capacityTotal || 20));
            const irregular = Math.floor(total * 0.2);
            const regular = total - irregular;
            payload = {
                total_capacity: total,
                regular_capacity: regular,
                irregular_capacity: irregular,
            };
        } else {
            const regular = Math.max(0, Number(manualRegular || 0));
            const irregular = Math.max(0, Number(manualIrregular || 0));
            payload = {
                regular_capacity: regular,
                irregular_capacity: irregular,
                total_capacity: regular + irregular,
            };
        }

        try {
            setSaving(true);
            await onUpdateSection(editingCapacity._id, payload);
            setEditingCapacity(null);
        } finally {
            setSaving(false);
        }
    };

    const handleOpenSectionCurriculum = (section) => {
        setSelectedSection(section);
        setSelectedCurriculumSubjects([]);
        setCurriculumError('');
    };

    const hasEnrolledStudents = (section) => Number(section?.regular || 0) > 0;

    const handleDeleteRowClick = (section) => {
        if (!deleteMode || hasEnrolledStudents(section) || !onDeleteSection) return;
        setDeleteError('');
        setSectionToDelete(section);
    };

    const handleConfirmDeleteSection = async () => {
        if (!sectionToDelete || !onDeleteSection) return;
        try {
            setDeleteSubmitting(true);
            setDeleteError('');
            await onDeleteSection(sectionToDelete._id);
            setSectionToDelete(null);
        } catch (error) {
            setDeleteError(error?.response?.data?.message || 'Failed to delete section.');
        } finally {
            setDeleteSubmitting(false);
        }
    };

    useEffect(() => {
        const fetchSectionCurriculum = async () => {
            if (!selectedSection) {
                setSelectedCurriculumSubjects([]);
                setCurriculumError('');
                return;
            }

            try {
                setCurriculumLoading(true);
                setSelectedCurriculumSubjects([]);
                setCurriculumError('');

                const yearKey = normalizeYearKey(selectedSection?.year);
                const semesterIndex = getSemesterIndex(selectedSection?.semester);

                if (!yearKey || semesterIndex < 0) {
                    setCurriculumError('Curriculum is unavailable for this section year/semester.');
                    return;
                }

                let curriculumDoc = curriculumCache[yearKey];
                if (!curriculumDoc) {
                    const res = await api.get(`/curriculum/${yearKey}`);
                    curriculumDoc = res.data;
                    setCurriculumCache((prev) => ({ ...prev, [yearKey]: curriculumDoc }));
                }

                const semesterSubjects = curriculumDoc?.semesters?.[semesterIndex]?.subjects;
                if (!Array.isArray(semesterSubjects) || semesterSubjects.length === 0) {
                    setCurriculumError('No curriculum subjects found for this semester.');
                    return;
                }

                setSelectedCurriculumSubjects(semesterSubjects);
            } catch (error) {
                setCurriculumError('Failed to load curriculum data.');
            } finally {
                setCurriculumLoading(false);
            }
        };

        fetchSectionCurriculum();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedSection]);

    useEffect(() => {
        if (!deleteMode) {
            setSectionToDelete(null);
            setDeleteError('');
        }
    }, [deleteMode]);

    return (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden font-sans h-full min-h-[380px] flex flex-col w-full">
            <div className="flex-1 min-h-[380px] overflow-y-auto custom-scrollbar">
                <table className="min-w-full border-collapse text-left text-sm md:text-base whitespace-nowrap">
                    <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200 text-gray-700">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-gray-500">Year</th>
                            <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-gray-500">Section</th>
                            <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-gray-500 text-center">Regular</th>
                            <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-gray-500 text-center">Irregular</th>
                            <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-gray-500 text-center">Total</th>
                            <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-gray-500 text-center">Capacity</th>
                            <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-gray-500 text-center">Curriculum</th>
                            <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-gray-500 text-center">Semester</th>
                            <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-gray-500 text-center">Status</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                        {sections && sections.length > 0 ? (
                            sections.map((sec) => {
                                const locked = hasEnrolledStudents(sec);
                                const deletable = deleteMode && !locked;

                                if (deleteMode && deletable) {
                                    return (
                                        <tr
                                            key={`${sec.year}-${sec.section}-${sec.semester ?? 'N/A'}`}
                                            onClick={() => handleDeleteRowClick(sec)}
                                            className="bg-red-50 hover:bg-red-100 cursor-pointer transition-colors"
                                        >
                                            <td className="px-6 py-4 font-semibold text-red-900">{sec.year}</td>
                                            <td className="px-6 py-4 font-semibold text-red-900">{sec.section}</td>
                                            <td colSpan="7" className="px-6 py-4 text-center text-red-700 font-semibold tracking-wide">
                                                Remove this Section
                                            </td>
                                        </tr>
                                    );
                                }

                                const rowClass = deleteMode && locked
                                    ? 'bg-gray-100 opacity-50 cursor-not-allowed pointer-events-none'
                                    : 'hover:bg-gray-50/80 transition-colors';

                                return (
                                    <tr key={`${sec.year}-${sec.section}-${sec.semester ?? 'N/A'}`} className={rowClass}>
                                        <td className="px-6 py-4 font-medium text-gray-900">{sec.year}</td>
                                        <td className="px-6 py-4 text-gray-800 font-medium">{sec.section}</td>
                                        <td className={`px-6 py-4 text-center ${getCapacityColorStyle(sec.regular, sec.regular_capacity)}`}>{`${sec.regular}/${sec.regular_capacity}`}</td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                type="button"
                                                onClick={() => openIrregularEditor(sec)}
                                                disabled={deleteMode}
                                                className={`${getCapacityColorStyle(sec.irregular, sec.irregular_capacity)} hover:text-[#2E522A] underline underline-offset-2 disabled:no-underline disabled:text-gray-400`}
                                            >
                                                {`${sec.irregular}/${sec.irregular_capacity}`}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-gray-900 font-semibold text-center">{sec.total}</td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                type="button"
                                                onClick={() => openCapacityEditor(sec)}
                                                disabled={deleteMode}
                                                className="text-gray-700 hover:text-[#2E522A] underline underline-offset-2 disabled:no-underline disabled:text-gray-400"
                                            >
                                                {sec.total_capacity}
                                            </button>
                                        </td>

                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => handleOpenSectionCurriculum(sec)}
                                                disabled={deleteMode}
                                                className="text-gray-400 hover:text-[#2E522A] transition-colors p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#2E522A]/50 disabled:hover:bg-transparent disabled:hover:text-gray-400"
                                                aria-label="View Curriculum"
                                                title="View Curriculum"
                                            >
                                                <i className="fa-solid fa-caret-down text-xl"></i>
                                            </button>
                                        </td>

                                        <td className="px-6 py-4 text-gray-700 font-medium text-center">{sec.semester ?? 'N/A'}</td>

                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center justify-center px-4 py-1.5 rounded-full text-xs tracking-wide w-28 ${getStatusStyle(sec.status)}`}>
                                                {sec.status}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <i className="fa-regular fa-folder-open text-3xl opacity-50"></i>
                                        <p>No sections found.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Curriculum Modal Overlay */}
            {selectedSection && createPortal(
                <div className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto p-4 md:p-6">
                    {/* Dark background blur */}
                    <div
                        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
                        onClick={() => setSelectedSection(null)}
                    />

                    {/* Modal Content */}
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 my-4">
                        <div className="flex items-center justify-between p-5 md:p-6 border-b border-gray-100 bg-white">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">
                                    Section Curriculum
                                </h3>
                                <p className="text-sm font-medium text-gray-500 mt-1">
                                    Year {selectedSection.year} <span className="mx-1">•</span> Section {selectedSection.section}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedSection(null)}
                                className="text-gray-400 hover:text-gray-800 bg-white hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-[#2E522A]/50"
                            >
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>

                        <div className="p-5 md:p-6 min-h-[360px] bg-gray-50/50">
                            <div className="mb-4 rounded-xl border border-gray-200 bg-white px-4 py-3">
                                <p className="text-sm text-gray-700">
                                    Shared curriculum for all enrolled students in this section.
                                    <span className="font-semibold"> Enrolled: {Number(selectedSection?.regular || 0)}</span>
                                </p>
                            </div>

                            {curriculumLoading ? (
                                <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-gray-500 gap-3">
                                    <i className="fa-solid fa-circle-notch fa-spin text-3xl text-[#2E522A]"></i>
                                    <p className="text-sm font-medium">Loading curriculum...</p>
                                </div>
                            ) : curriculumError ? (
                                <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-gray-500 gap-2 text-center">
                                    <i className="fa-regular fa-calendar-xmark text-4xl text-gray-400 opacity-70"></i>
                                    <p className="text-base font-semibold text-gray-700">Curriculum details not available.</p>
                                    <p className="text-sm text-gray-500">{curriculumError}</p>
                                </div>
                            ) : (
                                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                        <table className="min-w-full text-sm border-collapse">
                                            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-semibold">Code</th>
                                                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-semibold">Title</th>
                                                    <th className="px-4 py-3 text-center text-xs uppercase tracking-wider font-semibold">Lec</th>
                                                    <th className="px-4 py-3 text-center text-xs uppercase tracking-wider font-semibold">Lab</th>
                                                    <th className="px-4 py-3 text-center text-xs uppercase tracking-wider font-semibold">Units</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {selectedCurriculumSubjects.map((subject, idx) => (
                                                    <tr key={`${subject.subject_code || subject.code || 'subject'}-${idx}`} className="hover:bg-gray-50/80">
                                                        <td className="px-4 py-3 text-gray-800 font-medium whitespace-nowrap">
                                                            {subject.subject_code || subject.code || '-'}
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-700">{subject.title || '-'}</td>
                                                        <td className="px-4 py-3 text-center text-gray-600">{subject.lecture ?? 0}</td>
                                                        <td className="px-4 py-3 text-center text-gray-600">{subject.laboratory ?? 0}</td>
                                                        <td className="px-4 py-3 text-center text-gray-800 font-semibold">{subject.units ?? 0}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-gray-100 bg-white flex justify-end">
                            <button
                                onClick={() => setSelectedSection(null)}
                                className="px-6 py-2 bg-gray-100 text-gray-700 hover:text-gray-900 rounded-xl font-medium hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {editingIrregular && createPortal(
                <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/30" onClick={() => !saving && setEditingIrregular(null)} />
                    <div className="relative w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl border border-gray-200">
                        <h4 className="text-lg font-semibold text-gray-900">Set Irregular Count</h4>
                        <p className="text-xs text-gray-500 mt-1">Min: 0, Max: {irregularMax}</p>
                        <div className="mt-4 flex items-center gap-2">
                            <button
                                type="button"
                                className="w-9 h-9 rounded-lg border border-gray-200"
                                onClick={() => setIrregularValue((v) => Math.max(0, Number(v || 0) - 1))}
                            >
                                -
                            </button>
                            <input
                                type="number"
                                min={0}
                                max={irregularMax}
                                value={irregularValue}
                                onChange={(e) => setIrregularValue(Math.max(0, Math.min(Number(irregularMax || 0), Number(e.target.value || 0))))}
                                className="h-10 w-full rounded-lg border border-gray-300 px-3"
                            />
                            <button
                                type="button"
                                className="w-9 h-9 rounded-lg border border-gray-200"
                                onClick={() => setIrregularValue((v) => Math.min(Number(irregularMax || 0), Number(v || 0) + 1))}
                            >
                                +
                            </button>
                        </div>
                        <div className="mt-5 flex justify-end gap-2">
                            <button className="px-4 py-2 rounded-lg bg-gray-100" onClick={() => setEditingIrregular(null)} disabled={saving}>Cancel</button>
                            <button className="px-4 py-2 rounded-lg bg-[#2E522A] text-white" onClick={handleSaveIrregular} disabled={saving}>OK</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {editingCapacity && createPortal(
                <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/30" onClick={() => !saving && setEditingCapacity(null)} />
                    <div className="relative w-full max-w-md rounded-xl bg-white p-5 shadow-2xl border border-gray-200">
                        <h4 className="text-lg font-semibold text-gray-900">Set Capacity</h4>

                        {capacityMode === 'auto' ? (
                            <div className="mt-4">
                                <input
                                    type="number"
                                    min={20}
                                    value={capacityTotal}
                                    onChange={(e) => setCapacityTotal(Math.max(20, Number(e.target.value || 20)))}
                                    className="h-10 w-full rounded-lg border border-gray-300 px-3"
                                />
                            </div>
                        ) : (
                            <div className="mt-4 grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-gray-500">Regular</label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={manualRegular}
                                        onChange={(e) => setManualRegular(Math.max(0, Number(e.target.value || 0)))}
                                        className="h-10 w-full rounded-lg border border-gray-300 px-3 mt-1"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">Irregular</label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={manualIrregular}
                                        onChange={(e) => setManualIrregular(Math.max(0, Number(e.target.value || 0)))}
                                        className="h-10 w-full rounded-lg border border-gray-300 px-3 mt-1"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="mt-4 flex items-center gap-4">
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="radio"
                                    name="capacityMode"
                                    value="auto"
                                    checked={capacityMode === 'auto'}
                                    onChange={() => setCapacityMode('auto')}
                                />
                                Auto
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="radio"
                                    name="capacityMode"
                                    value="manual"
                                    checked={capacityMode === 'manual'}
                                    onChange={() => setCapacityMode('manual')}
                                />
                                Manual
                            </label>
                        </div>

                        <div className="mt-5 flex justify-end gap-2">
                            <button className="px-4 py-2 rounded-lg bg-gray-100" onClick={() => setEditingCapacity(null)} disabled={saving}>Cancel</button>
                            <button className="px-4 py-2 rounded-lg bg-[#2E522A] text-white" onClick={handleSaveCapacity} disabled={saving}>OK</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {sectionToDelete && createPortal(
                <div className="fixed inset-0 z-[220] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/35" onClick={() => !deleteSubmitting && setSectionToDelete(null)} />
                    <div className="relative w-full max-w-md rounded-xl border border-gray-200 bg-white p-5 shadow-2xl">
                        <h4 className="text-lg font-semibold text-gray-900">Delete Section</h4>
                        <p className="mt-2 text-sm text-gray-700">
                            Do you wish to Delete this Section: {sectionToDelete.year}{sectionToDelete.section}
                        </p>
                        {deleteError && (
                            <p className="mt-2 text-xs font-semibold text-red-600">{deleteError}</p>
                        )}
                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                className="px-4 py-2 rounded-lg bg-gray-100"
                                onClick={() => setSectionToDelete(null)}
                                disabled={deleteSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="px-4 py-2 rounded-lg bg-red-600 text-white"
                                onClick={handleConfirmDeleteSection}
                                disabled={deleteSubmitting}
                            >
                                {deleteSubmitting ? 'Deleting...' : 'OK'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

export default SectionTable;