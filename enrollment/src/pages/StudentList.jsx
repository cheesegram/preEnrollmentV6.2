import React, { useEffect, useState, useMemo } from 'react';
import NavLinkBtn from '../components/NavLinkBtn';
import logo from '../assets/iitilogo.png';
import StudentsTable from '../components/StudentsTable';
import api from "../lib/axios";

function StudentList() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [selected, setSelected] = useState("All Registered");
    const [students, setStudents] = useState([]);
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState("");
    const [selectedYear, setSelectedYear] = useState('All Year');
    const [selectedSection, setSelectedSection] = useState('All Section');
    const [selectedSemester, setSelectedSemester] = useState('All Sem');
    const isYearActive = selectedYear !== 'All Year';
    const isSectionActive = selectedSection !== 'All Section';
    const isSemesterActive = selectedSemester !== 'All Sem';

    const displayedStudents = useMemo(() => {
        let result = students;
        const isPendingView = selected === 'Pending';

        if (selected === 'All Registered') {
            result = result.filter(s => s.status !== 'Pending');
        } else if (!isPendingView) {
            result = result.filter(s => s.status === selected);
        }

        if (query) {
            const q = query.trim().toLowerCase();
            result = result.filter(s => {
                const num = String((isPendingView ? s.applicant_number : s.student_number) ?? "").toLowerCase();
                const first_name = String(s.first_name ?? "").trim().toLowerCase();
                const last_name = String(s.last_name ?? "").trim().toLowerCase();
                const pendingName = String(s.applicant_name ?? "").trim().toLowerCase();
                const name = isPendingView ? pendingName : `${first_name} ${last_name}`.trim().toLowerCase();
                const reverse_name = `${last_name} ${first_name}`.trim().toLowerCase();

                if (/^[a-z]/i.test(q)) return first_name.includes(q) || last_name.includes(q) || name.includes(q) || reverse_name.includes(q);
                return num.includes(q);
            });
        }

        if (!isPendingView && selectedYear !== 'All Year') {
            const yearMap = { 'First Year': '1', 'Second Year': '2', 'Third Year': '3', 'Fourth Year': '4' };
            const numericYear = yearMap[selectedYear];
            if (numericYear) result = result.filter(s => String(s.year) === numericYear);
        }

        if (!isPendingView && selectedSection !== 'All Section') {
            result = result.filter(s => s.section === selectedSection);
        }

        if (!isPendingView && selectedSemester !== 'All Sem') {
            const semesterMap = { '1st Sem': '1st', '2nd Sem': '2nd' };
            const semesterValue = semesterMap[selectedSemester];
            if (semesterValue) result = result.filter(s => String(s.semester) === semesterValue);
        }

        result = [...result].sort((a, b) => {
            if (isPendingView) {
                const left = String(a.applicant_number ?? "");
                const right = String(b.applicant_number ?? "");
                return left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' });
            }

            const yearA = Number(a.year ?? 0);
            const yearB = Number(b.year ?? 0);
            if (yearA !== yearB) return yearA - yearB;

            const sectionA = String(a.section ?? "");
            const sectionB = String(b.section ?? "");
            const sectionCompare = sectionA.localeCompare(sectionB, undefined, { numeric: true, sensitivity: 'base' });
            if (sectionCompare !== 0) return sectionCompare;

            const studentNumA = String(a.student_number ?? "");
            const studentNumB = String(b.student_number ?? "");
            const studentNumCompare = studentNumA.localeCompare(studentNumB, undefined, { numeric: true, sensitivity: 'base' });
            if (studentNumCompare !== 0) return studentNumCompare;

            return 0;
        });

        return result;
    }, [students, query, selectedYear, selectedSection, selectedSemester, selected]);

    useEffect(() => {
        const fetchSections = async () => {
            try {
                const res = await api.get('/students/sections');
                const data = Array.isArray(res.data) ? res.data : [];
                const sortedSections = [...data].sort((a, b) => {
                    const left = String(a ?? '').trim();
                    const right = String(b ?? '').trim();
                    const leftIsIrregular = left.toLowerCase() === 'irregular';
                    const rightIsIrregular = right.toLowerCase() === 'irregular';

                    if (leftIsIrregular && !rightIsIrregular) return 1;
                    if (!leftIsIrregular && rightIsIrregular) return -1;

                    return left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' });
                });

                setSections(['All Section', ...sortedSections]);
            } catch (error) {
                console.log('Error fetching sections');
            }
        };
        fetchSections();
    }, []);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                setLoading(true);
                const res = selected === 'Pending'
                    ? await api.get('/students/pending')
                    : await api.get(`/students?${new URLSearchParams(selected !== 'All Registered' ? { status: selected } : {}).toString()}`);
                setStudents(res.data);
            } catch (error) {
                console.log("Error fetching students");
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, [selected]);

    return (
        <div className="flex h-screen w-full bg-gray-50 overflow-hidden font-sans relative">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden absolute top-4 left-4 z-40 p-2 rounded-lg bg-white/90 shadow-md text-black text-2xl focus:outline-none">☰</button>
            {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity" onClick={() => setSidebarOpen(false)} />}

            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col p-6 transform transition-transform duration-300 md:relative md:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
                <button onClick={() => setSidebarOpen(false)} className="md:hidden absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 text-xl focus:outline-none">✕</button>
                <div className="flex flex-col items-center mb-10 mt-4 md:mt-0">
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">IITI</h1>
                    <h3 className="text-sm text-gray-500 font-medium">Enrollment System</h3>
                </div>
                <nav className="flex-1 w-full"><ul className="space-y-2 w-full"><NavLinkBtn /></ul></nav>
                <button className="mt-auto p-3 w-full flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600 font-medium">Log out</button>
            </aside>

            <main className="flex-1 overflow-y-auto overflow-x-hidden relative z-10 flex flex-col">
                <header>
                    <div className="flex flex-col sm:flex-row-reverse p-4 sm:p-6 items-center justify-center sm:justify-between w-full min-h-[8rem] bg-[url('/header.jpg')] bg-cover bg-center gap-4 relative z-20">
                        <img src={logo} className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-lg" alt="IITI Logo" />
                        <h3 className="text-sm sm:text-lg text-white font-bold text-center sm:text-right drop-shadow-md ml-auto max-w-lg">INSTITUTE OF INFORMATION TECHNOLOGY AND INNOVATION</h3>
                    </div>
                </header>

                {/* Subtle watermark background matching Dashboard */}
                <div className="absolute inset-0 bg-[url('/logo.png')] bg-no-repeat bg-top bg-[length:600px] opacity-5 pointer-events-none -z-10 mt-40 mix-blend-multiply"></div>

                <section className="p-4 sm:p-6 md:p-8 flex flex-col gap-6 relative z-10 flex-1 w-full max-w-[1600px] mx-auto">
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Student Directory</h1>

                    <div className="flex flex-col p-5 md:p-6 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-sm gap-6 w-full">
                        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between w-full">

                            <div className="relative flex-1 w-full lg:max-w-xl shrink-0">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <i className="fa-solid fa-magnifying-glass text-gray-400"></i>
                                </div>
                                <input
                                    type="text"
                                    placeholder={selected === 'Pending' ? 'Search Applicant Name or Number...' : 'Search Student Name or Number...'}
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    className="block w-full h-11 rounded-xl border border-gray-300 bg-white py-3 pl-11 pr-10 text-gray-900 focus:ring-2 focus:ring-[#2E522A] focus:border-transparent outline-none transition-all text-sm shadow-sm"
                                />
                                {query && <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1">✕</button>}
                            </div>
                            <div>
                                <div className="flex flex-wrap gap-4 items-start border border-white rounded-lg p-4">
                                    <div className="flex flex-col items-start gap-3">
                                        <div className="flex items-center gap-3 relative z-30">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Year</label>
                                            <div className="relative w-40 text-sm font-sans">
                                                <select
                                                    value={selectedYear}
                                                    onChange={(e) => setSelectedYear(e.target.value)}
                                                    className={`appearance-none w-full h-11 px-4 pr-10 border rounded-lg cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 font-normal ${isYearActive
                                                        ? 'border-gray-800 text-gray-900 bg-gray-50 shadow-sm'
                                                        : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                                                        }`}
                                                >
                                                    {['All Year', 'First Year', 'Second Year', 'Third Year', 'Fourth Year'].map((year) => (
                                                        <option key={year} value={year}>
                                                            {year}
                                                        </option>
                                                    ))}
                                                </select>
                                                <i className={`fa-solid fa-angle-down pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 ${isYearActive ? 'text-gray-900' : 'text-gray-400'}`}></i>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 relative z-20">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Section</label>
                                        <div className="relative w-40 text-sm font-sans">
                                            <select
                                                value={selectedSection}
                                                onChange={(e) => setSelectedSection(e.target.value)}
                                                className={`appearance-none w-full h-11 px-4 pr-10 border rounded-lg cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 font-normal ${isSectionActive
                                                    ? 'border-gray-800 text-gray-900 bg-gray-50 shadow-sm'
                                                    : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                                                    }`}
                                            >
                                                {sections.map((section) => (
                                                    <option key={section} value={section}>
                                                        {section}
                                                    </option>
                                                ))}
                                            </select>
                                            <i className={`fa-solid fa-angle-down pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 ${isSectionActive ? 'text-gray-900' : 'text-gray-400'}`}></i>
                                        </div>
                                    </div>
                                </div>
                                    <div className="flex items-center gap-3 pl-0">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Semester</label>
                                            <div className="flex items-center gap-3">
                                                {['All Sem', '1st Sem', '2nd Sem'].map((sem) => (
                                                    <label key={sem} className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="radio"
                                                            name="semester"
                                                            value={sem}
                                                            checked={selectedSemester === sem}
                                                            onChange={(e) => setSelectedSemester(e.target.value)}
                                                            className="w-4 h-4 cursor-pointer accent-[green] hover:accent-[#2E522A] focus:outline-none"
                                                        />
                                                        <span className="text-sm font-medium text-gray-700 select-none">{sem}</span>
                                                    </label>
                                                ))}
                                            </div>
                                    </div>
                            </div>
                               
                            </div>

                        <hr className="border-gray-100" />

                        <div className="flex flex-wrap items-center gap-4">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Status</span>
                            <div className="flex flex-wrap items-center gap-2">
                                <label className={`px-4 py-2 text-sm rounded-lg cursor-pointer border transition-all ${selected === "Pending" ? "bg-yellow-100 text-yellow-800 border-yellow-300 font-semibold" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                                    <input type="radio" name="status" value="Pending" checked={selected === "Pending"} onChange={() => setSelected("Pending")} className="sr-only" />
                                    Pending
                                </label>
                                <div className="w-px h-6 bg-gray-200 mx-1"></div>
                                {["All Registered", "Enrolled", "Irregular"].map((item) => (
                                    <label key={item} className={`px-4 py-2 text-sm rounded-lg cursor-pointer border transition-all ${selected === item ? "bg-[#2E522A] text-white border-[#2E522A] font-medium shadow-sm" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                                        <input type="radio" name="status" value={item} checked={selected === item} onChange={() => setSelected(item)} className="sr-only" />
                                        {item}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex-1 mb-8 relative z-0 min-h-[400px] flex flex-col">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center flex-1 p-20 text-gray-500 gap-4">
                                <i className="fa-solid fa-circle-notch fa-spin text-4xl text-[#2E522A]"></i>
                                <span className="text-lg font-medium">Loading Student Records...</span>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-auto">
                                <StudentsTable students={displayedStudents} className="w-full" isPendingView={selected === 'Pending'} />
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}

export default StudentList;