// ==========================================
// CLASSMARK
// School Result Management System
// ==========================================


// ==========================================
// SUPABASE CONFIGURATION
// ==========================================

const SUPABASE_URL =
    "https://wzqcjbuotsipshjgrboo.supabase.co";

const SUPABASE_PUBLIC_KEY =
    "sb_publishable_qwB02PL2sdF7gHDOxjGpA_-d_W4o6m";


// ==========================================
// SUPABASE CLIENT
// ==========================================

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLIC_KEY
    );


// ==========================================
// APPLICATION STATE
// ==========================================

let currentUser = null;
let teacherProfile = null;

let studentsCache = [];
let subjectsCache = [];
let marksCache = [];
let attendanceCache = [];

let editingStudentId = null;
let editingSubjectId = null;


// ==========================================
// APP START
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        console.log(
            "ClassMark application started."
        );

        await checkAuthentication();

    }
);


// ==========================================
// CHECK AUTHENTICATION
// ==========================================

async function checkAuthentication() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .auth
                .getSession();


        if (error) {

            console.error(
                "Authentication check failed:",
                error
            );

            return;

        }


        if (data.session) {

            currentUser =
                data.session.user;

            await loadTeacherProfile();


            if (teacherProfile) {

                showTeacherDashboard();

            }


            console.log(
                "User is authenticated:",
                currentUser.email
            );

        } else {

            console.log(
                "No authenticated user."
            );

        }

    } catch (error) {

        console.error(
            "Unexpected authentication error:",
            error
        );

    }

}


// ==========================================
// AUTH STATE LISTENER
// ==========================================

supabaseClient
    .auth
    .onAuthStateChange(
        async function (event, session) {

            console.log(
                "Auth event:",
                event
            );


            if (session) {

                currentUser =
                    session.user;


                if (!teacherProfile) {

                    await loadTeacherProfile();


                    if (teacherProfile) {

                        showTeacherDashboard();

                    }

                }

            } else {

                currentUser = null;

                teacherProfile = null;

                editingStudentId = null;

                editingSubjectId = null;

                studentsCache = [];

                subjectsCache = [];

                marksCache = [];

                attendanceCache = [];

            }

        }
    );


// ==========================================
// TEACHER LOGIN
// ==========================================

async function login(event) {

    event.preventDefault();


    const email =
        document
            .getElementById("username")
            .value
            .trim();


    const password =
        document
            .getElementById("password")
            .value;


    if (!email || !password) {

        alert(
            "Please enter your email and password."
        );

        return;

    }


    const submitButton =
        document.querySelector(
            "#loginForm button[type='submit']"
        );


    if (submitButton) {

        submitButton.disabled = true;

        submitButton.textContent =
            "Signing in...";

    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .auth
                .signInWithPassword({
                    email: email,
                    password: password
                });


        if (error) {

            console.error(
                "Login error:",
                error
            );

            alert(
                "Login failed. Please check your email and password."
            );

            return;

        }


        currentUser =
            data.user;


        await loadTeacherProfile();


        if (!teacherProfile) {

            return;

        }


        showTeacherDashboard();


        closeLogin();


        alert(
            "Welcome to ClassMark!"
        );


    } catch (error) {

        console.error(
            "Unexpected login error:",
            error
        );

        alert(
            "Something went wrong. Please try again."
        );


    } finally {

        if (submitButton) {

            submitButton.disabled = false;

            submitButton.textContent =
                "Sign In to ClassMark";

        }

    }

}


// ==========================================
// LOAD TEACHER PROFILE
// ==========================================

async function loadTeacherProfile() {

    if (!currentUser) {

        return null;

    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("Teacher")
                .select(`
                    id,
                    full_name,
                    phone,
                    username,
                    email,
                    school_name,
                    class_name,
                    session,
                    term
                `)
                .eq(
                    "id",
                    currentUser.id
                )
                .maybeSingle();


        if (error) {

            console.error(
                "Teacher profile error:",
                error
            );

            alert(
                "Unable to load your teacher profile."
            );

            return null;

        }


        if (!data) {

            alert(
                "Your teacher profile was not found."
            );

            return null;

        }


        teacherProfile = data;

        return teacherProfile;


    } catch (error) {

        console.error(
            "Unexpected teacher profile error:",
            error
        );

        return null;

    }

}


// ==========================================
// TEACHER DASHBOARD
// ==========================================

function showTeacherDashboard() {

    const loginModal =
        document.getElementById(
            "loginModal"
        );


    if (loginModal) {

        loginModal.classList.remove("active");

        loginModal.setAttribute(
            "aria-hidden",
            "true"
        );

    }


    const existingDashboard =
        document.getElementById(
            "teacherDashboard"
        );


    if (existingDashboard) {

        existingDashboard.remove();

    }


    const dashboard =
        document.createElement("section");


    dashboard.id =
        "teacherDashboard";


    dashboard.innerHTML = `

        <div class="teacher-dashboard">

            <div class="dashboard-topbar">

                <div>

                    <h2>
                        Teacher Dashboard
                    </h2>

                    <p>
                        Welcome back,
                        <strong>
                            ${escapeHTML(
                                teacherProfile?.full_name ||
                                "Teacher"
                            )}
                        </strong>
                    </p>

                </div>


                <button
                    type="button"
                    class="secondary-btn"
                    onclick="logoutTeacher()"
                >
                    Logout
                </button>

            </div>


            <div class="dashboard-welcome">

                <span class="hero-badge">
                    CLASSMARK WORKSPACE
                </span>

                <h1>
                    ${escapeHTML(
                        teacherProfile?.school_name ||
                        "Your School"
                    )}
                </h1>

                <p>

                    Class:
                    <strong>
                        ${escapeHTML(
                            teacherProfile?.class_name || "-"
                        )}
                    </strong>

                    &nbsp; | &nbsp;

                    Session:
                    <strong>
                        ${escapeHTML(
                            teacherProfile?.session || "-"
                        )}
                    </strong>

                    &nbsp; | &nbsp;

                    Term:
                    <strong>
                        ${escapeHTML(
                            teacherProfile?.term || "-"
                        )}
                    </strong>

                </p>

            </div>


            <div class="dashboard-cards">


                <button
                    type="button"
                    class="dashboard-card dashboard-card-button"
                    onclick="showStudents()"
                >

                    <span>👨‍🎓</span>

                    <h3>
                        Students
                    </h3>

                    <p>
                        Add and manage your students.
                    </p>

                </button>


                <button
                    type="button"
                    class="dashboard-card dashboard-card-button"
                    onclick="showSubjects()"
                >

                    <span>📚</span>

                    <h3>
                        Subjects
                    </h3>

                    <p>
                        Manage class subjects.
                    </p>

                </button>


                <button
                    type="button"
                    class="dashboard-card dashboard-card-button"
                    onclick="showMarks()"
                >

                    <span>📝</span>

                    <h3>
                        Marks
                    </h3>

                    <p>
                        Enter CA and examination marks.
                    </p>

                </button>


                <button
                    type="button"
                    class="dashboard-card dashboard-card-button"
                    onclick="showAttendance()"
                >

                    <span>📅</span>

                    <h3>
                        Attendance
                    </h3>

                    <p>
                        Manage student attendance.
                    </p>

                </button>


                <button
                    type="button"
                    class="dashboard-card dashboard-card-button"
                    onclick="showResults()"
                >

                    <span>📊</span>

                    <h3>
                        Results
                    </h3>

                    <p>
                        Calculate results and ranking.
                    </p>

                </button>


                <button
                    type="button"
                    class="dashboard-card dashboard-card-button"
                    onclick="showReports()"
                >

                    <span>📄</span>

                    <h3>
                        Reports
                    </h3>

                    <p>
                        Generate professional report cards.
                    </p>

                </button>


            </div>

        </div>

    `;


    const main =
        document.querySelector("main");


    if (main) {

        main.appendChild(dashboard);

    }


    addDashboardStyles();

}


// ==========================================
// LOGOUT
// ==========================================

async function logoutTeacher() {

    try {

        const {
            error
        } =
            await supabaseClient
                .auth
                .signOut();


        if (error) {

            console.error(
                "Logout error:",
                error
            );

            alert(
                "Unable to logout."
            );

            return;

        }


        currentUser = null;

        teacherProfile = null;

        studentsCache = [];

        subjectsCache = [];

        marksCache = [];

        attendanceCache = [];


        const dashboard =
            document.getElementById(
                "teacherDashboard"
            );


        if (dashboard) {

            dashboard.remove();

        }


    } catch (error) {

        console.error(
            "Unexpected logout error:",
            error
        );

    }

}


// ==========================================
// DASHBOARD STYLES
// ==========================================

function addDashboardStyles() {

    if (
        document.getElementById(
            "classmarkDashboardStyles"
        )
    ) {

        return;

    }


    const style =
        document.createElement("style");


    style.id =
        "classmarkDashboardStyles";


    style.textContent = `

        .teacher-dashboard {

            max-width: 1200px;

            margin: 0 auto;

            padding: 50px 20px 80px;

        }


        .dashboard-topbar {

            display: flex;

            justify-content: space-between;

            align-items: center;

            gap: 20px;

            margin-bottom: 35px;

        }


        .dashboard-topbar h2 {

            margin: 0 0 8px;

        }


        .dashboard-topbar p {

            margin: 0;

            opacity: .75;

        }


        .dashboard-welcome {

            padding: 35px;

            border-radius: 20px;

            margin-bottom: 30px;

            background:
                linear-gradient(
                    135deg,
                    #0b1220,
                    #111c32
                );

            border:
                1px solid
                rgba(212,175,55,.25);

        }


        .dashboard-welcome h1 {

            margin: 15px 0 10px;

        }


        .dashboard-welcome p {

            margin: 0;

            line-height: 1.7;

        }


        .dashboard-cards {

            display: grid;

            grid-template-columns:
                repeat(3, 1fr);

            gap: 20px;

        }


        .dashboard-card {

            padding: 28px;

            border-radius: 18px;

            background: #111827;

            border:
                1px solid
                rgba(255,255,255,.08);

            transition:
                transform .2s ease,
                border-color .2s ease,
                box-shadow .2s ease;

        }


        .dashboard-card:hover {

            transform:
                translateY(-4px);

            border-color:
                rgba(212,175,55,.5);

            box-shadow:
                0 12px 30px
                rgba(0,0,0,.18);

        }


        .dashboard-card-button {

            width: 100%;

            text-align: left;

            color: inherit;

            font: inherit;

            cursor: pointer;

            appearance: none;

        }


        .dashboard-card-button:focus-visible {

            outline:
                3px solid
                rgba(212,175,55,.7);

            outline-offset: 3px;

        }


        .dashboard-card span {

            font-size: 28px;

        }


        .dashboard-card h3 {

            margin: 16px 0 8px;

        }


        .dashboard-card p {

            margin: 0;

            opacity: .7;

            line-height: 1.6;

        }


        @media (max-width: 850px) {

            .dashboard-cards {

                grid-template-columns:
                    repeat(2,1fr);

            }

        }


        @media (max-width: 560px) {

            .dashboard-topbar {

                align-items:
                    flex-start;

                flex-direction:
                    column;

            }


            .dashboard-welcome {

                padding: 25px;

            }


            .dashboard-cards {

                grid-template-columns: 1fr;

            }

        }

    `;


    document.head.appendChild(style);

}


// ==========================================
// STUDENTS MANAGEMENT
// ==========================================

async function showStudents() {

    if (!currentUser) {

        alert("Please login first.");

        return;

    }


    removeManagementSections();


    const dashboard =
        document.getElementById(
            "teacherDashboard"
        );


    if (!dashboard) return;


    editingStudentId = null;


    const section =
        document.createElement("section");


    section.id =
        "studentsSection";


    section.className =
        "students-section";


    section.innerHTML = `

        <div class="management-header">

            <div>

                <span class="hero-badge">
                    STUDENT MANAGEMENT
                </span>

                <h2>
                    Students
                </h2>

                <p>
                    Add, search and manage your students.
                </p>

            </div>


            <button
                type="button"
                class="primary-btn"
                onclick="openStudentForm()"
            >
                + Add Student
            </button>

        </div>


        <div class="management-toolbar">

            <div class="count-box">

                <strong id="studentCount">
                    0
                </strong>

                <span>
                    Students
                </span>

            </div>


            <input
                type="search"
                id="studentSearch"
                placeholder="Search student..."
                oninput="filterStudents()"
                autocomplete="off"
            >

        </div>


        <div
            id="studentFormContainer"
            class="management-form"
            style="display:none;"
        >

            <h3 id="studentFormTitle">
                Add Student
            </h3>


            <form
                id="studentForm"
                onsubmit="saveStudent(event)"
            >

                <div class="form-grid">

                    <div>

                        <label>
                            Full Name
                        </label>

                        <input
                            type="text"
                            id="studentName"
                            required
                        >

                    </div>


                    <div>

                        <label>
                            Gender
                        </label>

                        <select
                            id="studentGender"
                            required
                        >

                            <option value="">
                                Select gender
                            </option>

                            <option value="Male">
                                Male
                            </option>

                            <option value="Female">
                                Female
                            </option>

                        </select>

                    </div>


                    <div>

                        <label>
                            Date of Birth
                        </label>

                        <input
                            type="date"
                            id="studentDob"
                        >

                    </div>


                    <div>

                        <label>
                            Admission Number
                        </label>

                        <input
                            type="text"
                            id="studentAdmission"
                        >

                    </div>


                    <div>

                        <label>
                            Class
                        </label>

                        <input
                            type="text"
                            id="studentClass"
                            required
                        >

                    </div>


                    <div>

                        <label>
                            Academic Session
                        </label>

                        <input
                            type="text"
                            id="studentSession"
                            required
                        >

                    </div>


                    <div>

                        <label>
                            Term
                        </label>

                        <select
                            id="studentTerm"
                            required
                        >

                            <option value="">
                                Select term
                            </option>

                            <option value="First Term">
                                First Term
                            </option>

                            <option value="Second Term">
                                Second Term
                            </option>

                            <option value="Third Term">
                                Third Term
                            </option>

                        </select>

                    </div>

                </div>


                <div
                    id="studentFormError"
                    class="form-error"
                ></div>


                <div class="form-actions">

                    <button
                        type="button"
                        class="secondary-btn"
                        onclick="closeStudentForm()"
                    >
                        Cancel
                    </button>


                    <button
                        type="submit"
                        class="primary-btn"
                        id="studentSubmitButton"
                    >
                        Save Student
                    </button>

                </div>

            </form>

        </div>


        <div id="studentsList">
            Loading students...
        </div>

    `;


    dashboard.appendChild(section);


    addManagementStyles();


    await loadStudents();

}


// ==========================================
// STUDENT FORM
// ==========================================

function openStudentForm(studentId = null) {

    const container =
        document.getElementById(
            "studentFormContainer"
        );


    const form =
        document.getElementById(
            "studentForm"
        );


    if (!container || !form) return;


    editingStudentId =
        studentId;


    form.reset();


    if (studentId) {

        const student =
            studentsCache.find(
                item =>
                    item.id === studentId
            );


        if (!student) return;


        document.getElementById(
            "studentName"
        ).value =
            student.full_name || "";


        document.getElementById(
            "studentGender"
        ).value =
            student.gender || "";


        document.getElementById(
            "studentDob"
        ).value =
            student.date_of_birth || "";


        document.getElementById(
            "studentAdmission"
        ).value =
            student.admission_number || "";


        document.getElementById(
            "studentClass"
        ).value =
            student.class_name || "";


        document.getElementById(
            "studentSession"
        ).value =
            student.session || "";


        document.getElementById(
            "studentTerm"
        ).value =
            student.term || "";


        document.getElementById(
            "studentFormTitle"
        ).textContent =
            "Edit Student";


        document.getElementById(
            "studentSubmitButton"
        ).textContent =
            "Update Student";

    } else {

        document.getElementById(
            "studentClass"
        ).value =
            teacherProfile?.class_name || "";


        document.getElementById(
            "studentSession"
        ).value =
            teacherProfile?.session || "";


        document.getElementById(
            "studentTerm"
        ).value =
            teacherProfile?.term || "";


        document.getElementById(
            "studentFormTitle"
        ).textContent =
            "Add Student";


        document.getElementById(
            "studentSubmitButton"
        ).textContent =
            "Save Student";

    }


    showStudentFormError("");


    container.style.display =
        "block";


    container.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}


// ==========================================
// CLOSE STUDENT FORM
// ==========================================

function closeStudentForm() {

    const container =
        document.getElementById(
            "studentFormContainer"
        );


    if (container) {

        container.style.display =
            "none";

    }


    editingStudentId = null;

}


// ==========================================
// SAVE STUDENT
// ==========================================

async function saveStudent(event) {

    event.preventDefault();


    if (!currentUser) return;


    const fullName =
        document.getElementById(
            "studentName"
        ).value.trim();


    const gender =
        document.getElementById(
            "studentGender"
        ).value;


    const dateOfBirth =
        document.getElementById(
            "studentDob"
        ).value || null;


    const admissionNumber =
        document.getElementById(
            "studentAdmission"
        ).value.trim() || null;


    const className =
        document.getElementById(
            "studentClass"
        ).value.trim();


    const session =
        document.getElementById(
            "studentSession"
        ).value.trim();


    const term =
        document.getElementById(
            "studentTerm"
        ).value;


    const button =
        document.getElementById(
            "studentSubmitButton"
        );


    const editing =
        Boolean(editingStudentId);


    if (button) {

        button.disabled = true;

        button.textContent =
            editing
                ? "Updating..."
                : "Saving...";

    }


    try {

        const payload = {

            teacher_id:
                currentUser.id,

            full_name:
                fullName,

            gender:
                gender,

            date_of_birth:
                dateOfBirth,

            admission_number:
                admissionNumber,

            class_name:
                className,

            session:
                session,

            term:
                term

        };


        let response;


        if (editingStudentId) {

            response =
                await supabaseClient
                    .from("students")
                    .update(payload)
                    .eq(
                        "id",
                        editingStudentId
                    )
                    .eq(
                        "teacher_id",
                        currentUser.id
                    );

        } else {

            response =
                await supabaseClient
                    .from("students")
                    .insert([
                        payload
                    ]);

        }


        if (response.error) {

            console.error(
                response.error
            );


            showStudentFormError(
                response.error.code === "23505"
                    ? "This admission number already exists."
                    : "Unable to save student."
            );


            return;

        }


        closeStudentForm();

        await loadStudents();


    } catch (error) {

        console.error(
            error
        );

        showStudentFormError(
            "Something went wrong."
        );

    } finally {

        if (button) {

            button.disabled = false;

            button.textContent =
                editing
                    ? "Update Student"
                    : "Save Student";

        }

    }

}


// ==========================================
// LOAD STUDENTS
// ==========================================

async function loadStudents() {

    const list =
        document.getElementById(
            "studentsList"
        );


    if (!list || !currentUser) return;


    list.innerHTML =
        "Loading students...";


    const {
        data,
        error
    } =
        await supabaseClient
            .from("students")
            .select(`
                id,
                full_name,
                gender,
                date_of_birth,
                admission_number,
                class_name,
                session,
                term
            `)
            .eq(
                "teacher_id",
                currentUser.id
            );


    if (error) {

        console.error(
            error
        );

        list.innerHTML =
            "Unable to load students.";

        return;

    }


    studentsCache =
        data || [];


    sortStudents(
        studentsCache
    );


    updateStudentCount(
        studentsCache.length
    );


    renderStudents(
        studentsCache
    );

}


// ==========================================
// SORT STUDENTS
// ==========================================

function sortStudents(students) {

    students.sort(
        function (a, b) {

            const order = {
                Male: 1,
                Female: 2
            };


            const genderDifference =
                (
                    order[a.gender] || 3
                ) -
                (
                    order[b.gender] || 3
                );


            if (
                genderDifference !== 0
            ) {

                return genderDifference;

            }


            return String(
                a.full_name || ""
            ).localeCompare(
                String(
                    b.full_name || ""
                ),
                undefined,
                {
                    sensitivity: "base"
                }
            );

        }
    );

}


// ==========================================
// STUDENT COUNT
// ==========================================

function updateStudentCount(count) {

    const element =
        document.getElementById(
            "studentCount"
        );


    if (element) {

        element.textContent =
            count;

    }

}


// ==========================================
// FILTER STUDENTS
// ==========================================

function filterStudents() {

    const input =
        document.getElementById(
            "studentSearch"
        );


    if (!input) return;


    const query =
        input.value
            .trim()
            .toLowerCase();


    const filtered =
        studentsCache.filter(
            student => {

                return (
                    String(
                        student.full_name || ""
                    )
                    .toLowerCase()
                    .includes(query) ||

                    String(
                        student.admission_number || ""
                    )
                    .toLowerCase()
                    .includes(query) ||

                    String(
                        student.gender || ""
                    )
                    .toLowerCase()
                    .includes(query)
                );

            }
        );


    renderStudents(
        filtered
    );

}


// ==========================================
// RENDER STUDENTS
// ==========================================

function renderStudents(students) {

    const list =
        document.getElementById(
            "studentsList"
        );


    if (!list) return;


    if (!students.length) {

        list.innerHTML = `

            <div class="empty-box">

                <div>
                    👨‍🎓
                </div>

                <h3>
                    No students found
                </h3>

                <p>
                    Add a student or change your search.
                </p>

            </div>

        `;

        return;

    }


    list.innerHTML = `

        <div class="data-table-wrapper">

            <table class="data-table">

                <thead>

                    <tr>

                        <th>#</th>

                        <th>Student</th>

                        <th>Gender</th>

                        <th>Admission</th>

                        <th>Class</th>

                        <th>Session</th>

                        <th>Term</th>

                        <th>Actions</th>

                    </tr>

                </thead>


                <tbody>

                    ${students.map(
                        (student, index) => `

                            <tr>

                                <td>
                                    ${index + 1}
                                </td>

                                <td>
                                    <strong>
                                        ${escapeHTML(
                                            student.full_name
                                        )}
                                    </strong>
                                </td>

                                <td>
                                    ${escapeHTML(
                                        student.gender
                                    )}
                                </td>

                                <td>
                                    ${escapeHTML(
                                        student.admission_number ||
                                        "—"
                                    )}
                                </td>

                                <td>
                                    ${escapeHTML(
                                        student.class_name
                                    )}
                                </td>

                                <td>
                                    ${escapeHTML(
                                        student.session
                                    )}
                                </td>

                                <td>
                                    ${escapeHTML(
                                        student.term
                                    )}
                                </td>

                                <td>

                                    <button
                                        class="small-action"
                                        onclick="openStudentForm('${student.id}')"
                                    >
                                        Edit
                                    </button>

                                    <button
                                        class="small-action danger"
                                        onclick="deleteStudent('${student.id}')"
                                    >
                                        Delete
                                    </button>

                                </td>

                            </tr>

                        `
                    ).join("")}

                </tbody>

            </table>

        </div>

    `;

}


// ==========================================
// DELETE STUDENT
// ==========================================

async function deleteStudent(studentId) {

    const student =
        studentsCache.find(
            item =>
                item.id === studentId
        );


    if (!student) return;


    if (
        !confirm(
            `Delete "${student.full_name}"?\n\nThis action cannot be undone.`
        )
    ) {

        return;

    }


    const {
        error
    } =
        await supabaseClient
            .from("students")
            .delete()
            .eq(
                "id",
                studentId
            )
            .eq(
                "teacher_id",
                currentUser.id
            );


    if (error) {

        console.error(
            error
        );

        alert(
            "Unable to delete student."
        );

        return;

    }


    await loadStudents();

}


// ==========================================
// STUDENT FORM ERROR
// ==========================================

function showStudentFormError(message) {

    const element =
        document.getElementById(
            "studentFormError"
        );


    if (element) {

        element.textContent =
            message;

    }

}


// ==========================================
// SUBJECTS MANAGEMENT
// ==========================================

async function showSubjects() {

    if (!currentUser) {

        alert(
            "Please login first."
        );

        return;

    }


    removeManagementSections();


    const dashboard =
        document.getElementById(
            "teacherDashboard"
        );


    if (!dashboard) return;


    editingSubjectId = null;


    const section =
        document.createElement("section");


    section.id =
        "subjectsSection";


    section.className =
        "management-section";


    section.innerHTML = `

        <div class="management-header">

            <div>

                <span class="hero-badge">
                    SUBJECT MANAGEMENT
                </span>

                <h2>
                    Subjects
                </h2>

                <p>
                    Manage subjects for your class.
                </p>

            </div>


            <button
                type="button"
                class="primary-btn"
                onclick="openSubjectForm()"
            >
                + Add Subject
            </button>

        </div>


        <div class="management-toolbar">

            <div class="count-box">

                <strong id="subjectCount">
                    0
                </strong>

                <span>
                    Subjects
                </span>

            </div>


            <input
                type="search"
                id="subjectSearch"
                placeholder="Search subject..."
                oninput="filterSubjects()"
            >

        </div>


        <div
            id="subjectFormContainer"
            class="management-form"
            style="display:none;"
        >

            <h3 id="subjectFormTitle">
                Add Subject
            </h3>


            <form
                id="subjectForm"
                onsubmit="saveSubject(event)"
            >

                <div class="form-grid">

                    <div>

                        <label>
                            Subject Name
                        </label>

                        <input
                            type="text"
                            id="subjectName"
                            required
                        >

                    </div>


                    <div>

                        <label>
                            Subject Code
                        </label>

                        <input
                            type="text"
                            id="subjectCode"
                        >

                    </div>


                    <div>

                        <label>
                            Class
                        </label>

                        <input
                            type="text"
                            id="subjectClass"
                            required
                        >

                    </div>


                    <div>

                        <label>
                            Academic Session
                        </label>

                        <input
                            type="text"
                            id="subjectSession"
                            required
                        >

                    </div>


                    <div>

                        <label>
                            Term
                        </label>

                        <select
                            id="subjectTerm"
                            required
                        >

                            <option value="">
                                Select term
                            </option>

                            <option>
                                First Term
                            </option>

                            <option>
                                Second Term
                            </option>

                            <option>
                                Third Term
                            </option>

                        </select>

                    </div>

                </div>


                <div
                    id="subjectFormError"
                    class="form-error"
                ></div>


                <div class="form-actions">

                    <button
                        type="button"
                        class="secondary-btn"
                        onclick="closeSubjectForm()"
                    >
                        Cancel
                    </button>


                    <button
                        type="submit"
                        class="primary-btn"
                        id="subjectSubmitButton"
                    >
                        Save Subject
                    </button>

                </div>

            </form>

        </div>


        <div id="subjectsList">
            Loading subjects...
        </div>

    `;


    dashboard.appendChild(section);


    addManagementStyles();


    await loadSubjects();

}


// ==========================================
// SUBJECT FORM
// ==========================================

function openSubjectForm(subjectId = null) {

    const container =
        document.getElementById(
            "subjectFormContainer"
        );


    const form =
        document.getElementById(
            "subjectForm"
        );


    if (!container || !form) return;


    editingSubjectId =
        subjectId;


    form.reset();


    if (subjectId) {

        const subject =
            subjectsCache.find(
                item =>
                    item.id === subjectId
            );


        if (!subject) return;


        document.getElementById(
            "subjectName"
        ).value =
            subject.subject_name || "";


        document.getElementById(
            "subjectCode"
        ).value =
            subject.subject_code || "";


        document.getElementById(
            "subjectClass"
        ).value =
            subject.class_name || "";


        document.getElementById(
            "subjectSession"
        ).value =
            subject.session || "";


        document.getElementById(
            "subjectTerm"
        ).value =
            subject.term || "";


        document.getElementById(
            "subjectFormTitle"
        ).textContent =
            "Edit Subject";


        document.getElementById(
            "subjectSubmitButton"
        ).textContent =
            "Update Subject";

    } else {

        document.getElementById(
            "subjectClass"
        ).value =
            teacherProfile?.class_name || "";


        document.getElementById(
            "subjectSession"
        ).value =
            teacherProfile?.session || "";


        document.getElementById(
            "subjectTerm"
        ).value =
            teacherProfile?.term || "";


        document.getElementById(
            "subjectFormTitle"
        ).textContent =
            "Add Subject";


        document.getElementById(
            "subjectSubmitButton"
        ).textContent =
            "Save Subject";

    }


    container.style.display =
        "block";


    container.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}


// ==========================================
// CLOSE SUBJECT FORM
// ==========================================

function closeSubjectForm() {

    const container =
        document.getElementById(
            "subjectFormContainer"
        );


    if (container) {

        container.style.display =
            "none";

    }


    editingSubjectId = null;

}


// ==========================================
// SAVE SUBJECT
// ==========================================

async function saveSubject(event) {

    event.preventDefault();


    if (!currentUser) return;


    const subjectName =
        document.getElementById(
            "subjectName"
        ).value.trim();


    const subjectCode =
        document.getElementById(
            "subjectCode"
        ).value.trim() || null;


    const className =
        document.getElementById(
            "subjectClass"
        ).value.trim();


    const session =
        document.getElementById(
            "subjectSession"
        ).value.trim();


    const term =
        document.getElementById(
            "subjectTerm"
        ).value;


    const duplicate =
        subjectsCache.find(
            subject => {

                return (
                    subject.id !==
                    editingSubjectId &&

                    String(
                        subject.subject_name || ""
                    )
                    .trim()
                    .toLowerCase() ===
                    subjectName.toLowerCase() &&

                    String(
                        subject.class_name || ""
                    )
                    .trim()
                    .toLowerCase() ===
                    className.toLowerCase() &&

                    String(
                        subject.session || ""
                    )
                    .trim()
                    .toLowerCase() ===
                    session.toLowerCase() &&

                    String(
                        subject.term || ""
                    )
                    .trim()
                    .toLowerCase() ===
                    term.toLowerCase()
                );

            }
        );


    if (duplicate) {

        showSubjectFormError(
            "This subject already exists for this class, session and term."
        );

        return;

    }


    const button =
        document.getElementById(
            "subjectSubmitButton"
        );


    const editing =
        Boolean(editingSubjectId);


    if (button) {

        button.disabled = true;

        button.textContent =
            editing
                ? "Updating..."
                : "Saving...";

    }


    try {

        const payload = {

            teacher_id:
                currentUser.id,

            subject_name:
                subjectName,

            subject_code:
                subjectCode,

            class_name:
                className,

            session:
                session,

            term:
                term

        };


        let response;


        if (editingSubjectId) {

            response =
                await supabaseClient
                    .from("subjects")
                    .update(payload)
                    .eq(
                        "id",
                        editingSubjectId
                    )
                    .eq(
                        "teacher_id",
                        currentUser.id
                    );

        } else {

            response =
                await supabaseClient
                    .from("subjects")
                    .insert([
                        payload
                    ]);

        }


        if (response.error) {

            console.error(
                response.error
            );


            showSubjectFormError(
                response.error.code === "23505"
                    ? "This subject already exists."
                    : "Unable to save subject."
            );


            return;

        }


        closeSubjectForm();

        await loadSubjects();


    } catch (error) {

        console.error(
            error
        );

        showSubjectFormError(
            "Something went wrong."
        );

    } finally {

        if (button) {

            button.disabled = false;

            button.textContent =
                editing
                    ? "Update Subject"
                    : "Save Subject";

        }

    }

}


// ==========================================
// LOAD SUBJECTS
// ==========================================

async function loadSubjects() {

    const list =
        document.getElementById(
            "subjectsList"
        );


    if (!list || !currentUser) return;


    list.innerHTML =
        "Loading subjects...";


    const {
        data,
        error
    } =
        await supabaseClient
            .from("subjects")
            .select(`
                id,
                subject_name,
                subject_code,
                class_name,
                session,
                term
            `)
            .eq(
                "teacher_id",
                currentUser.id
            )
            .order(
                "subject_name",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(
            error
        );

        list.innerHTML =
            "Unable to load subjects.";

        return;

    }


    subjectsCache =
        data || [];


    updateSubjectCount(
        subjectsCache.length
    );


    renderSubjects(
        subjectsCache
    );

}


// ==========================================
// FILTER SUBJECTS
// ==========================================

function filterSubjects() {

    const input =
        document.getElementById(
            "subjectSearch"
        );


    if (!input) return;


    const query =
        input.value
            .trim()
            .toLowerCase();


    const filtered =
        subjectsCache.filter(
            subject => {

                return (
                    String(
                        subject.subject_name || ""
                    )
                    .toLowerCase()
                    .includes(query) ||

                    String(
                        subject.subject_code || ""
                    )
                    .toLowerCase()
                    .includes(query) ||

                    String(
                        subject.class_name || ""
                    )
                    .toLowerCase()
                    .includes(query)
                );

            }
        );


    renderSubjects(
        filtered
    );

}


// ==========================================
// RENDER SUBJECTS
// ==========================================

function renderSubjects(subjects) {

    const list =
        document.getElementById(
            "subjectsList"
        );


    if (!list) return;


    if (!subjects.length) {

        list.innerHTML = `

            <div class="empty-box">

                <div>📚</div>

                <h3>
                    No subjects found
                </h3>

                <p>
                    Add your first subject.
                </p>

            </div>

        `;

        return;

    }


    list.innerHTML = `

        <div class="data-table-wrapper">

            <table class="data-table">

                <thead>

                    <tr>

                        <th>#</th>

                        <th>Subject</th>

                        <th>Code</th>

                        <th>Class</th>

                        <th>Session</th>

                        <th>Term</th>

                        <th>Actions</th>

                    </tr>

                </thead>


                <tbody>

                    ${subjects.map(
                        (subject, index) => `

                            <tr>

                                <td>
                                    ${index + 1}
                                </td>

                                <td>
                                    <strong>
                                        ${escapeHTML(
                                            subject.subject_name
                                        )}
                                    </strong>
                                </td>

                                <td>
                                    ${escapeHTML(
                                        subject.subject_code ||
                                        "—"
                                    )}
                                </td>

                                <td>
                                    ${escapeHTML(
                                        subject.class_name
                                    )}
                                </td>

                                <td>
                                    ${escapeHTML(
                                        subject.session
                                    )}
                                </td>

                                <td>
                                    ${escapeHTML(
                                        subject.term
                                    )}
                                </td>

                                <td>

                                    <button
                                        class="small-action"
                                        onclick="openSubjectForm('${subject.id}')"
                                    >
                                        Edit
                                    </button>

                                    <button
                                        class="small-action danger"
                                        onclick="deleteSubject('${subject.id}')"
                                    >
                                        Delete
                                    </button>

                                </td>

                            </tr>

                        `
                    ).join("")}

                </tbody>

            </table>

        </div>

    `;

}


// ==========================================
// DELETE SUBJECT
// ==========================================

async function deleteSubject(subjectId) {

    const subject =
        subjectsCache.find(
            item =>
                item.id === subjectId
        );


    if (!subject) return;


    if (
        !confirm(
            `Delete "${subject.subject_name}"?\n\nThis may also remove related marks.`
        )
    ) {

        return;

    }


    const {
        error
    } =
        await supabaseClient
            .from("subjects")
            .delete()
            .eq(
                "id",
                subjectId
            )
            .eq(
                "teacher_id",
                currentUser.id
            );


    if (error) {

        console.error(
            error
        );

        alert(
            "Unable to delete subject."
        );

        return;

    }


    await loadSubjects();

}


// ==========================================
// SUBJECT COUNT
// ==========================================

function updateSubjectCount(count) {

    const element =
        document.getElementById(
            "subjectCount"
        );


    if (element) {

        element.textContent =
            count;

    }

}


// ==========================================
// SUBJECT ERROR
// ==========================================

function showSubjectFormError(message) {

    const element =
        document.getElementById(
            "subjectFormError"
        );


    if (element) {

        element.textContent =
            message;

    }

}


// ==========================================
// MARKS MANAGEMENT
// ==========================================

async function showMarks() {

    if (!currentUser) {

        alert(
            "Please login first."
        );

        return;

    }


    removeManagementSections();


    const dashboard =
        document.getElementById(
            "teacherDashboard"
        );


    if (!dashboard) return;


    const section =
        document.createElement("section");


    section.id =
        "marksSection";


    section.className =
        "management-section";


    section.innerHTML = `

        <div class="management-header">

            <div>

                <span class="hero-badge">
                    MARKS MANAGEMENT
                </span>

                <h2>
                    Enter Marks
                </h2>

                <p>
                    Enter CA1, CA2, CA3 and examination scores.
                </p>

            </div>

        </div>


        <div class="marks-controls">

            <div>

                <label>
                    Subject
                </label>

                <select
                    id="marksSubject"
                    onchange="loadMarksForSelectedSubject()"
                >

                    <option value="">
                        Select subject
                    </option>

                </select>

            </div>


            <div>

                <label>
                    Session
                </label>

                <input
                    type="text"
                    id="marksSession"
                    value="${escapeHTML(
                        teacherProfile?.session || ""
                    )}"
                >

            </div>


            <div>

                <label>
                    Term
                </label>

                <select
                    id="marksTerm"
                    onchange="loadMarksForSelectedSubject()"
                >

                    <option>
                        First Term
                    </option>

                    <option>
                        Second Term
                    </option>

                    <option>
                        Third Term
                    </option>

                </select>

            </div>

        </div>


        <div
            id="marksMessage"
            class="module-message"
        ></div>


        <div
            id="marksTableContainer"
        >

            <div class="empty-box">

                <div>📝</div>

                <h3>
                    Select a subject
                </h3>

                <p>
                    Choose a subject above to enter marks.
                </p>

            </div>

        </div>

    `;


    dashboard.appendChild(section);


    addManagementStyles();


    populateMarksSubjects();


    document.getElementById(
        "marksTerm"
    ).value =
        teacherProfile?.term ||
        "First Term";

}


// ==========================================
// POPULATE MARK SUBJECTS
// ==========================================

function populateMarksSubjects() {

    const select =
        document.getElementById(
            "marksSubject"
        );


    if (!select) return;


    const session =
        document.getElementById(
            "marksSession"
        ).value.trim();


    const term =
        document.getElementById(
            "marksTerm"
        ).value;


    const filtered =
        subjectsCache.filter(
            subject => {

                return (
                    subject.session === session &&
                    subject.term === term
                );

            }
        );


    select.innerHTML = `

        <option value="">
            Select subject
        </option>

        ${
            filtered.map(
                subject => `
                    <option value="${subject.id}">
                        ${escapeHTML(
                            subject.subject_name
                        )}
                        ${
                            subject.subject_code
                                ? ` (${escapeHTML(subject.subject_code)})`
                                : ""
                        }
                    </option>
                `
            ).join("")
        }

    `;

}


// ==========================================
// LOAD MARKS FOR SUBJECT
// ==========================================

async function loadMarksForSelectedSubject() {

    populateMarksSubjects();


    const select =
        document.getElementById(
            "marksSubject"
        );


    if (!select) return;


    const subjectId =
        select.value;


    const session =
        document.getElementById(
            "marksSession"
        ).value.trim();


    const term =
        document.getElementById(
            "marksTerm"
        ).value;


    const container =
        document.getElementById(
            "marksTableContainer"
        );


    if (!subjectId) {

        container.innerHTML = `

            <div class="empty-box">

                <div>📝</div>

                <h3>
                    Select a subject
                </h3>

                <p>
                    Choose a subject above.
                </p>

            </div>

        `;

        return;

    }


    if (!session || !term) return;


    container.innerHTML =
        `<div class="loading-box">Loading marks...</div>`;


    const {
        data,
        error
    } =
        await supabaseClient
            .from("marks")
            .select(`
                id,
                student_id,
                subject_id,
                ca1,
                ca2,
                ca3,
                exam,
                total
            `)
            .eq(
                "teacher_id",
                currentUser.id
            )
            .eq(
                "subject_id",
                subjectId
            )
            .eq(
                "session",
                session
            )
            .eq(
                "term",
                term
            );


    if (error) {

        console.error(
            error
        );

        container.innerHTML =
            `<div class="error-box">Unable to load marks.</div>`;

        return;

    }


    marksCache =
        data || [];


    renderMarksTable(
        subjectId,
        session,
        term
    );

}


// ==========================================
// RENDER MARKS TABLE
// ==========================================

function renderMarksTable(
    subjectId,
    session,
    term
) {

    const container =
        document.getElementById(
            "marksTableContainer"
        );


    if (!container) return;


    if (!studentsCache.length) {

        container.innerHTML = `

            <div class="empty-box">

                <div>👨‍🎓</div>

                <h3>
                    No students available
                </h3>

                <p>
                    Add students before entering marks.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML = `

        <div class="marks-table-wrapper">

            <table class="marks-table">

                <thead>

                    <tr>

                        <th>#</th>

                        <th>Student</th>

                        <th>CA1<br><small>/20</small></th>

                        <th>CA2<br><small>/20</small></th>

                        <th>CA3<br><small>/20</small></th>

                        <th>Exam<br><small>/40</small></th>

                        <th>Total<br><small>/100</small></th>

                    </tr>

                </thead>


                <tbody>

                    ${studentsCache.map(
                        (student, index) => {

                            const existing =
                                marksCache.find(
                                    mark =>
                                        mark.student_id ===
                                        student.id
                                );


                            return `

                                <tr>

                                    <td>
                                        ${index + 1}
                                    </td>


                                    <td>

                                        <strong>
                                            ${escapeHTML(
                                                student.full_name
                                            )}
                                        </strong>

                                    </td>


                                    <td>

                                        <input
                                            type="number"
                                            min="0"
                                            max="20"
                                            step="0.01"
                                            class="mark-input"
                                            data-student="${student.id}"
                                            data-field="ca1"
                                            value="${existing?.ca1 ?? 0}"
                                            oninput="updateMarkTotal(this)"
                                        >

                                    </td>


                                    <td>

                                        <input
                                            type="number"
                                            min="0"
                                            max="20"
                                            step="0.01"
                                            class="mark-input"
                                            data-student="${student.id}"
                                            data-field="ca2"
                                            value="${existing?.ca2 ?? 0}"
                                            oninput="updateMarkTotal(this)"
                                        >

                                    </td>


                                    <td>

                                        <input
                                            type="number"
                                            min="0"
                                            max="20"
                                            step="0.01"
                                            class="mark-input"
                                            data-student="${student.id}"
                                            data-field="ca3"
                                            value="${existing?.ca3 ?? 0}"
                                            oninput="updateMarkTotal(this)"
                                        >

                                    </td>


                                    <td>

                                        <input
                                            type="number"
                                            min="0"
                                            max="40"
                                            step="0.01"
                                            class="mark-input"
                                            data-student="${student.id}"
                                            data-field="exam"
                                            value="${existing?.exam ?? 0}"
                                            oninput="updateMarkTotal(this)"
                                        >

                                    </td>


                                    <td>

                                        <strong
                                            class="mark-total"
                                            data-total-student="${student.id}"
                                        >
                                            ${existing?.total ?? 0}
                                        </strong>

                                    </td>

                                </tr>

                            `;

                        }
                    ).join("")}

                </tbody>

            </table>

        </div>


        <div class="marks-save-bar">

            <span>
                CA total = 60 marks &nbsp; | &nbsp;
                Exam = 40 marks &nbsp; | &nbsp;
                Total = 100 marks
            </span>


            <button
                type="button"
                class="primary-btn"
                onclick="saveAllMarks('${subjectId}')"
            >
                Save Marks
            </button>

        </div>

    `;

}


// ==========================================
// UPDATE MARK TOTAL LIVE
// ==========================================

function updateMarkTotal(input) {

    const studentId =
        input.dataset.student;


    const inputs =
        document.querySelectorAll(
            `.mark-input[data-student="${studentId}"]`
        );


    let total = 0;


    inputs.forEach(
        field => {

            total +=
                Number(
                    field.value || 0
                );

        }
    );


    const totalElement =
        document.querySelector(
            `[data-total-student="${studentId}"]`
        );


    if (totalElement) {

        totalElement.textContent =
            total.toFixed(2);

    }

}


// ==========================================
// SAVE ALL MARKS
// ==========================================

async function saveAllMarks(subjectId) {

    if (!currentUser) return;


    const session =
        document.getElementById(
            "marksSession"
        ).value.trim();


    const term =
        document.getElementById(
            "marksTerm"
        ).value;


    const subject =
        subjectsCache.find(
            item =>
                item.id === subjectId
        );


    if (!subject) {

        alert(
            "Subject not found."
        );

        return;

    }


    const inputs =
        document.querySelectorAll(
            ".mark-input"
        );


    const grouped = {};


    inputs.forEach(
        input => {

            const studentId =
                input.dataset.student;


            const field =
                input.dataset.field;


            if (!grouped[studentId]) {

                grouped[studentId] = {

                    ca1: 0,
                    ca2: 0,
                    ca3: 0,
                    exam: 0

                };

            }


            grouped[studentId][field] =
                Number(
                    input.value || 0
                );

        }
    );


    const rows = [];


    for (
        const studentId
        of Object.keys(grouped)
    ) {

        const mark =
            grouped[studentId];


        if (
            mark.ca1 < 0 ||
            mark.ca1 > 20 ||
            mark.ca2 < 0 ||
            mark.ca2 > 20 ||
            mark.ca3 < 0 ||
            mark.ca3 > 20 ||
            mark.exam < 0 ||
            mark.exam > 40
        ) {

            alert(
                "One or more marks are outside the allowed range."
            );

            return;

        }


        rows.push({

            teacher_id:
                currentUser.id,

            student_id:
                studentId,

            subject_id:
                subjectId,

            class_name:
                subject.class_name,

            session:
                session,

            term:
                term,

            ca1:
                mark.ca1,

            ca2:
                mark.ca2,

            ca3:
                mark.ca3,

            exam:
                mark.exam

        });

    }


    if (!rows.length) return;


    const button =
        document.querySelector(
            ".marks-save-bar .primary-btn"
        );


    if (button) {

        button.disabled = true;

        button.textContent =
            "Saving...";

    }


    const {
        error
    } =
        await supabaseClient
            .from("marks")
            .upsert(
                rows,
                {
                    onConflict:
                        "student_id,subject_id,session,term"
                }
            );


    if (button) {

        button.disabled = false;

        button.textContent =
            "Save Marks";

    }


    if (error) {

        console.error(
            "Marks save error:",
            error
        );

        alert(
            "Unable to save marks. Please try again."
        );

        return;

    }


    showModuleMessage(
        "Marks saved successfully.",
        "success"
    );


    await loadMarksForSelectedSubject();

}


// ==========================================
// ATTENDANCE MANAGEMENT
// ==========================================

async function showAttendance() {

    if (!currentUser) {

        alert(
            "Please login first."
        );

        return;

    }


    removeManagementSections();


    const dashboard =
        document.getElementById(
            "teacherDashboard"
        );


    if (!dashboard) return;


    const section =
        document.createElement("section");


    section.id =
        "attendanceSection";


    section.className =
        "management-section";


    section.innerHTML = `

        <div class="management-header">

            <div>

                <span class="hero-badge">
                    ATTENDANCE MANAGEMENT
                </span>

                <h2>
                    Student Attendance
                </h2>

                <p>
                    Record school days and student attendance.
                </p>

            </div>

        </div>


        <div class="marks-controls">

            <div>

                <label>
                    Academic Session
                </label>

                <input
                    id="attendanceSession"
                    value="${escapeHTML(
                        teacherProfile?.session || ""
                    )}"
                >

            </div>


            <div>

                <label>
                    Term
                </label>

                <select id="attendanceTerm">

                    <option>
                        First Term
                    </option>

                    <option>
                        Second Term
                    </option>

                    <option>
                        Third Term
                    </option>

                </select>

            </div>


            <div>

                <label>
                    Total School Days
                </label>

                <input
                    type="number"
                    id="totalSchoolDays"
                    min="0"
                    value="0"
                >

            </div>

        </div>


        <div
            id="attendanceMessage"
            class="module-message"
        ></div>


        <div id="attendanceTableContainer">

            <div class="empty-box">

                <div>📅</div>

                <h3>
                    Attendance
                </h3>

                <p>
                    Enter total school days and attendance below.
                </p>

            </div>

        </div>

    `;


    dashboard.appendChild(section);


    addManagementStyles();


    document.getElementById(
        "attendanceTerm"
    ).value =
        teacherProfile?.term ||
        "First Term";


    document.getElementById(
        "totalSchoolDays"
    ).addEventListener(
        "input",
        loadAttendanceTable
    );


    document.getElementById(
        "attendanceTerm"
    ).addEventListener(
        "change",
        loadAttendanceTable
    );


    document.getElementById(
        "attendanceSession"
    ).addEventListener(
        "input",
        loadAttendanceTable
    );


    await loadAttendanceTable();

}


// ==========================================
// LOAD ATTENDANCE
// ==========================================

async function loadAttendanceTable() {

    const session =
        document.getElementById(
            "attendanceSession"
        )?.value.trim();


    const term =
        document.getElementById(
            "attendanceTerm"
        )?.value;


    const container =
        document.getElementById(
            "attendanceTableContainer"
        );


    if (!container || !session || !term) return;


    const {
        data,
        error
    } =
        await supabaseClient
            .from("attendance")
            .select(`
                id,
                student_id,
                total_school_days,
                present_days,
                absent_days,
                attendance_percentage
            `)
            .eq(
                "teacher_id",
                currentUser.id
            )
            .eq(
                "session",
                session
            )
            .eq(
                "term",
                term
            );


    if (error) {

        console.error(
            error
        );

        container.innerHTML =
            `<div class="error-box">Unable to load attendance.</div>`;

        return;

    }


    attendanceCache =
        data || [];


    renderAttendanceTable();

}


// ==========================================
// RENDER ATTENDANCE
// ==========================================

function renderAttendanceTable() {

    const container =
        document.getElementById(
            "attendanceTableContainer"
        );


    if (!container) return;


    if (!studentsCache.length) {

        container.innerHTML = `

            <div class="empty-box">

                <div>👨‍🎓</div>

                <h3>
                    No students
                </h3>

                <p>
                    Add students before recording attendance.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML = `

        <div class="data-table-wrapper">

            <table class="data-table">

                <thead>

                    <tr>

                        <th>#</th>

                        <th>Student</th>

                        <th>Present Days</th>

                        <th>Absent</th>

                        <th>Percentage</th>

                    </tr>

                </thead>


                <tbody>

                    ${studentsCache.map(
                        (student, index) => {

                            const record =
                                attendanceCache.find(
                                    item =>
                                        item.student_id ===
                                        student.id
                                );


                            return `

                                <tr>

                                    <td>
                                        ${index + 1}
                                    </td>

                                    <td>
                                        <strong>
                                            ${escapeHTML(
                                                student.full_name
                                            )}
                                        </strong>
                                    </td>

                                    <td>

                                        <input
                                            type="number"
                                            min="0"
                                            class="attendance-present"
                                            data-student="${student.id}"
                                            value="${record?.present_days ?? 0}"
                                            oninput="updateAttendanceRow(this)"
                                        >

                                    </td>

                                    <td
                                        data-absent="${student.id}"
                                    >
                                        ${record?.absent_days ?? 0}
                                    </td>

                                    <td
                                        data-percentage="${student.id}"
                                    >
                                        ${Number(
                                            record?.attendance_percentage ?? 0
                                        ).toFixed(2)}%
                                    </td>

                                </tr>

                            `;

                        }
                    ).join("")}

                </tbody>

            </table>

        </div>


        <div class="marks-save-bar">

            <span>
                Attendance is calculated automatically.
            </span>


            <button
                type="button"
                class="primary-btn"
                onclick="saveAttendance()"
            >
                Save Attendance
            </button>

        </div>

    `;

}


// ==========================================
// UPDATE ATTENDANCE LIVE
// ==========================================

function updateAttendanceRow(input) {

    const total =
        Number(
            document.getElementById(
                "totalSchoolDays"
            ).value || 0
        );


    let present =
        Number(
            input.value || 0
        );


    if (present < 0) present = 0;


    if (present > total) {

        present = total;

        input.value =
            total;

    }


    const studentId =
        input.dataset.student;


    const absent =
        Math.max(
            0,
            total - present
        );


    const percentage =
        total > 0
            ? (
                present /
                total
            ) * 100
            : 0;


    const absentElement =
        document.querySelector(
            `[data-absent="${studentId}"]`
        );


    const percentageElement =
        document.querySelector(
            `[data-percentage="${studentId}"]`
        );


    if (absentElement) {

        absentElement.textContent =
            absent;

    }


    if (percentageElement) {

        percentageElement.textContent =
            percentage.toFixed(2) + "%";

    }

}


// ==========================================
// SAVE ATTENDANCE
// ==========================================

async function saveAttendance() {

    const total =
        Number(
            document.getElementById(
                "totalSchoolDays"
            ).value || 0
        );


    const session =
        document.getElementById(
            "attendanceSession"
        ).value.trim();


    const term =
        document.getElementById(
            "attendanceTerm"
        ).value;


    if (
        total < 0 ||
        !session ||
        !term
    ) {

        alert(
            "Please enter valid attendance information."
        );

        return;

    }


    const inputs =
        document.querySelectorAll(
            ".attendance-present"
        );


    const rows = [];


    inputs.forEach(
        input => {

            let present =
                Number(
                    input.value || 0
                );


            present =
                Math.max(
                    0,
                    Math.min(
                        present,
                        total
                    )
                );


            rows.push({

                teacher_id:
                    currentUser.id,

                student_id:
                    input.dataset.student,

                class_name:
                    teacherProfile?.class_name ||
                    "",

                session:
                    session,

                term:
                    term,

                total_school_days:
                    total,

                present_days:
                    present

            });

        }
    );


    const button =
        document.querySelector(
            "#attendanceSection .marks-save-bar .primary-btn"
        );


    if (button) {

        button.disabled = true;

        button.textContent =
            "Saving...";

    }


    const {
        error
    } =
        await supabaseClient
            .from("attendance")
            .upsert(
                rows,
                {
                    onConflict:
                        "student_id,session,term"
                }
            );


    if (button) {

        button.disabled = false;

        button.textContent =
            "Save Attendance";

    }


    if (error) {

        console.error(
            error
        );

        alert(
            "Unable to save attendance."
        );

        return;

    }


    showModuleMessage(
        "Attendance saved successfully.",
        "success"
    );


    await loadAttendanceTable();

}


// ==========================================
// RESULTS
// ==========================================

async function showResults() {

    if (!currentUser) {

        alert(
            "Please login first."
        );

        return;

    }


    removeManagementSections();


    const dashboard =
        document.getElementById(
            "teacherDashboard"
        );


    if (!dashboard) return;


    const section =
        document.createElement("section");


    section.id =
        "resultsSection";


    section.className =
        "management-section";


    section.innerHTML = `

        <div class="management-header">

            <div>

                <span class="hero-badge">
                    RESULT MANAGEMENT
                </span>

                <h2>
                    Academic Results
                </h2>

                <p>
                    View totals, averages, grades, attendance and ranking.
                </p>

            </div>

        </div>


        <div class="results-controls">

            <select id="resultsSession">

                <option>
                    ${escapeHTML(
                        teacherProfile?.session ||
                        ""
                    )}
                </option>

            </select>


            <select id="resultsTerm">

                <option>
                    First Term
                </option>

                <option>
                    Second Term
                </option>

                <option>
                    Third Term
                </option>

            </select>


            <button
                type="button"
                class="primary-btn"
                onclick="loadResults()"
            >
                Generate Results
            </button>

        </div>


        <div
            id="resultsContainer"
            class="results-container"
        >

            <div class="empty-box">

                <div>📊</div>

                <h3>
                    Generate Results
                </h3>

                <p>
                    Select the session and term.
                </p>

            </div>

        </div>

    `;


    dashboard.appendChild(section);


    addManagementStyles();


    document.getElementById(
        "resultsTerm"
    ).value =
        teacherProfile?.term ||
        "First Term";


    await loadResults();

}


// ==========================================
// LOAD RESULTS
// ==========================================

async function loadResults() {

    const session =
        document.getElementById(
            "resultsSession"
        ).value;


    const term =
        document.getElementById(
            "resultsTerm"
        ).value;


    const container =
        document.getElementById(
            "resultsContainer"
        );


    if (!container) return;


    container.innerHTML =
        `<div class="loading-box">Calculating results...</div>`;


    const [
        marksResponse,
        attendanceResponse
    ] =
        await Promise.all([

            supabaseClient
                .from("marks")
                .select(`
                    student_id,
                    subject_id,
                    ca1,
                    ca2,
                    ca3,
                    exam,
                    total
                `)
                .eq(
                    "teacher_id",
                    currentUser.id
                )
                .eq(
                    "session",
                    session
                )
                .eq(
                    "term",
                    term
                ),

            supabaseClient
                .from("attendance")
                .select(`
                    student_id,
                    total_school_days,
                    present_days,
                    absent_days,
                    attendance_percentage
                `)
                .eq(
                    "teacher_id",
                    currentUser.id
                )
                .eq(
                    "session",
                    session
                )
                .eq(
                    "term",
                    term
                )

        ]);


    if (
        marksResponse.error ||
        attendanceResponse.error
    ) {

        console.error(
            marksResponse.error ||
            attendanceResponse.error
        );

        container.innerHTML =
            `<div class="error-box">Unable to generate results.</div>`;

        return;

    }


    const marks =
        marksResponse.data || [];


    const attendance =
        attendanceResponse.data || [];


    const relevantStudents =
        studentsCache.filter(
            student =>
                student.session === session &&
                student.term === term
        );


    const relevantSubjects =
        subjectsCache.filter(
            subject =>
                subject.session === session &&
                subject.term === term
        );


    const resultRows =
        relevantStudents.map(
            student => {

                const studentMarks =
                    marks.filter(
                        mark =>
                            mark.student_id ===
                            student.id
                    );


                const total =
                    studentMarks.reduce(
                        (
                            sum,
                            mark
                        ) =>
                            sum +
                            Number(
                                mark.total || 0
                            ),
                        0
                    );


                const average =
                    studentMarks.length
                        ? total /
                            studentMarks.length
                        : 0;


                const passed =
                    studentMarks.filter(
                        mark =>
                            Number(
                                mark.total
                            ) >= 40
                    ).length;


                const failed =
                    studentMarks.length -
                    passed;


                const attendanceRecord =
                    attendance.find(
                        item =>
                            item.student_id ===
                            student.id
                    );


                return {

                    student,
                    marks: studentMarks,
                    subjects:
                        relevantSubjects.length,

                    total,

                    average,

                    passed,

                    failed,

                    status:
                        failed === 0 &&
                        studentMarks.length > 0
                            ? "PASS"
                            : "FAIL",

                    attendance:
                        attendanceRecord

                };

            }
        );


    resultRows.sort(
        (a, b) =>
            b.total -
            a.total
    );


    let lastTotal = null;

    let lastPosition = 0;


    resultRows.forEach(
        (row, index) => {

            if (
                lastTotal ===
                row.total
            ) {

                row.position =
                    lastPosition;

            } else {

                row.position =
                    index + 1;

                lastPosition =
                    row.position;

                lastTotal =
                    row.total;

            }

        }
    );


    renderResults(
        resultRows
    );

}


// ==========================================
// RENDER RESULTS
// ==========================================

function renderResults(rows) {

    const container =
        document.getElementById(
            "resultsContainer"
        );


    if (!container) return;


    if (!rows.length) {

        container.innerHTML = `

            <div class="empty-box">

                <div>📊</div>

                <h3>
                    No results available
                </h3>

                <p>
                    Enter marks for students first.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML = `

        <div class="results-summary">

            <div>
                <strong>
                    ${rows.length}
                </strong>
                Students
            </div>

            <div>
                <strong>
                    ${
                        rows.filter(
                            row =>
                                row.status ===
                                "PASS"
                        ).length
                    }
                </strong>
                Passed
            </div>

            <div>
                <strong>
                    ${
                        rows.filter(
                            row =>
                                row.status ===
                                "FAIL"
                        ).length
                    }
                </strong>
                Failed
            </div>

        </div>


        <div class="data-table-wrapper">

            <table class="data-table">

                <thead>

                    <tr>

                        <th>Position</th>

                        <th>Student</th>

                        <th>Total</th>

                        <th>Average</th>

                        <th>Passed</th>

                        <th>Failed</th>

                        <th>Attendance</th>

                        <th>Status</th>

                        <th>Report</th>

                    </tr>

                </thead>


                <tbody>

                    ${rows.map(
                        row => `

                            <tr>

                                <td>
                                    <strong>
                                        ${row.position}
                                    </strong>
                                    ${
                                        row.position === 1
                                            ? " 🏆"
                                            : ""
                                    }
                                </td>


                                <td>

                                    <strong>
                                        ${escapeHTML(
                                            row.student.full_name
                                        )}
                                    </strong>

                                </td>


                                <td>
                                    ${row.total.toFixed(2)}
                                </td>


                                <td>
                                    ${row.average.toFixed(2)}
                                </td>


                                <td>
                                    ${row.passed}
                                </td>


                                <td>
                                    ${row.failed}
                                </td>


                                <td>
                                    ${
                                        Number(
                                            row.attendance
                                                ?.attendance_percentage ||
                                            0
                                        ).toFixed(2)
                                    }%
                                </td>


                                <td>

                                    <span
                                        class="status-badge ${
                                            row.status === "PASS"
                                                ? "status-pass"
                                                : "status-fail"
                                        }"
                                    >
                                        ${row.status}
                                    </span>

                                </td>


                                <td>

                                    <button
                                        type="button"
                                        class="small-action"
                                        onclick="generateStudentReport('${row.student.id}')"
                                    >
                                        View Report
                                    </button>

                                </td>

                            </tr>

                        `
                    ).join("")}

                </tbody>

            </table>

        </div>

    `;

}


// ==========================================
// REPORTS
// ==========================================

async function showReports() {

    if (!currentUser) {

        alert(
            "Please login first."
        );

        return;

    }


    removeManagementSections();


    const dashboard =
        document.getElementById(
            "teacherDashboard"
        );


    if (!dashboard) return;


    const section =
        document.createElement("section");


    section.id =
        "reportsSection";


    section.className =
        "management-section";


    section.innerHTML = `

        <div class="management-header">

            <div>

                <span class="hero-badge">
                    REPORT CENTER
                </span>

                <h2>
                    Student Reports
                </h2>

                <p>
                    Generate printable professional report cards.
                </p>

            </div>

        </div>


        <div class="report-student-grid">

            ${
                studentsCache.length
                    ? studentsCache
                        .map(
                            student => `

                                <div class="report-student-card">

                                    <div class="report-avatar">
                                        ${escapeHTML(
                                            student.full_name
                                                .charAt(0)
                                                .toUpperCase()
                                        )}
                                    </div>

                                    <div>

                                        <h3>
                                            ${escapeHTML(
                                                student.full_name
                                            )}
                                        </h3>

                                        <p>
                                            ${escapeHTML(
                                                student.class_name
                                            )}
                                            ·
                                            ${escapeHTML(
                                                student.session
                                            )}
                                            ·
                                            ${escapeHTML(
                                                student.term
                                            )}
                                        </p>

                                    </div>


                                    <button
                                        type="button"
                                        class="primary-btn"
                                        onclick="generateStudentReport('${student.id}')"
                                    >
                                        Generate
                                    </button>

                                </div>

                            `
                        )
                        .join("")
                    : `
                        <div class="empty-box">

                            <div>📄</div>

                            <h3>
                                No students
                            </h3>

                            <p>
                                Add students before generating reports.
                            </p>

                        </div>
                    `
            }

        </div>

    `;


    dashboard.appendChild(section);


    addManagementStyles();

}


// ==========================================
// GENERATE STUDENT REPORT
// ==========================================

async function generateStudentReport(studentId) {

    if (!currentUser) return;


    const student =
        studentsCache.find(
            item =>
                item.id === studentId
        );


    if (!student) {

        alert(
            "Student not found."
        );

        return;

    }


    const session =
        student.session;


    const term =
        student.term;


    const [
        marksResponse,
        subjectsResponse,
        attendanceResponse
    ] =
        await Promise.all([

            supabaseClient
                .from("marks")
                .select(`
                    subject_id,
                    ca1,
                    ca2,
                    ca3,
                    exam,
                    total
                `)
                .eq(
                    "teacher_id",
                    currentUser.id
                )
                .eq(
                    "student_id",
                    studentId
                )
                .eq(
                    "session",
                    session
                )
                .eq(
                    "term",
                    term
                ),

            supabaseClient
                .from("subjects")
                .select(`
                    id,
                    subject_name,
                    subject_code
                `)
                .eq(
                    "teacher_id",
                    currentUser.id
                )
                .eq(
                    "session",
                    session
                )
                .eq(
                    "term",
                    term
                ),

            supabaseClient
                .from("attendance")
                .select(`
                    total_school_days,
                    present_days,
                    absent_days,
                    attendance_percentage
                `)
                .eq(
                    "teacher_id",
                    currentUser.id
                )
                .eq(
                    "student_id",
                    studentId
                )
                .eq(
                    "session",
                    session
                )
                .eq(
                    "term",
                    term
                )
                .maybeSingle()

        ]);


    if (
        marksResponse.error ||
        subjectsResponse.error
    ) {

        console.error(
            marksResponse.error ||
            subjectsResponse.error
        );

        alert(
            "Unable to generate report."
        );

        return;

    }


    const marks =
        marksResponse.data || [];


    const subjects =
        subjectsResponse.data || [];


    const attendance =
        attendanceResponse.data;


    const total =
        marks.reduce(
            (
                sum,
                mark
            ) =>
                sum +
                Number(
                    mark.total || 0
                ),
            0
        );


    const average =
        marks.length
            ? total / marks.length
            : 0;


    const passed =
        marks.filter(
            mark =>
                Number(mark.total) >= 40
        ).length;


    const failed =
        marks.length -
        passed;


    const status =
        failed === 0 &&
        marks.length > 0
            ? "PASS"
            : "FAIL";


    const reportRows =
        marks.map(
            mark => {

                const subject =
                    subjects.find(
                        item =>
                            item.id ===
                            mark.subject_id
                    );


                const score =
                    Number(
                        mark.total || 0
                    );


                return {

                    subject:
                        subject?.subject_name ||
                        "Subject",

                    ca:
                        (
                            Number(mark.ca1 || 0) +
                            Number(mark.ca2 || 0) +
                            Number(mark.ca3 || 0)
                        ),

                    exam:
                        Number(
                            mark.exam || 0
                        ),

                    total:
                        score,

                    grade:
                        getGrade(score),

                    remark:
                        getRemark(score)

                };

            }
        );


    const reportWindow =
        window.open(
            "",
            "_blank",
            "width=1000,height=800"
        );


    if (!reportWindow) {

        alert(
            "Please allow pop-ups to generate the report."
        );

        return;

    }


    reportWindow.document.write(`

        <!DOCTYPE html>

        <html>

        <head>

            <title>
                ClassMark Report - ${escapeHTML(
                    student.full_name
                )}
            </title>


            <style>

                * {
                    box-sizing: border-box;
                }

                body {

                    margin: 0;

                    font-family:
                        Arial,
                        Helvetica,
                        sans-serif;

                    color: #111827;

                    background: #f3f4f6;

                }


                .report {

                    width: 210mm;

                    min-height: 297mm;

                    margin: 20px auto;

                    padding: 22mm;

                    background: white;

                }


                .header {

                    text-align: center;

                    border-bottom:
                        3px solid #d4af37;

                    padding-bottom: 18px;

                    margin-bottom: 20px;

                }


                .header h1 {

                    margin: 0;

                    font-size: 28px;

                    color: #0b1220;

                }


                .header h2 {

                    margin: 8px 0;

                    font-size: 18px;

                }


                .header p {

                    margin: 4px 0;

                    color: #4b5563;

                }


                .student-info {

                    display: grid;

                    grid-template-columns:
                        repeat(2,1fr);

                    gap: 10px;

                    margin-bottom: 20px;

                }


                .info-box {

                    padding: 12px;

                    border:
                        1px solid #e5e7eb;

                    border-radius: 8px;

                }


                .info-box strong {

                    display: block;

                    margin-bottom: 4px;

                    color: #6b7280;

                    font-size: 12px;

                    text-transform:
                        uppercase;

                }


                table {

                    width: 100%;

                    border-collapse:
                        collapse;

                    margin-top: 15px;

                }


                th {

                    background: #0b1220;

                    color: white;

                    padding: 10px;

                    text-align: left;

                    font-size: 12px;

                }


                td {

                    padding: 9px;

                    border:
                        1px solid #e5e7eb;

                    font-size: 12px;

                }


                .summary {

                    display: grid;

                    grid-template-columns:
                        repeat(4,1fr);

                    gap: 10px;

                    margin-top: 20px;

                }


                .summary-box {

                    padding: 13px;

                    border:
                        1px solid #e5e7eb;

                    text-align: center;

                    border-radius: 8px;

                }


                .summary-box strong {

                    display: block;

                    font-size: 20px;

                    color: #0b1220;

                }


                .pass {

                    color: #15803d;

                    font-weight: bold;

                }


                .fail {

                    color: #dc2626;

                    font-weight: bold;

                }


                .footer {

                    margin-top: 45px;

                    display: grid;

                    grid-template-columns:
                        repeat(2,1fr);

                    gap: 50px;

                }


                .signature {

                    padding-top: 35px;

                    border-top:
                        1px solid #111827;

                    text-align: center;

                }


                .print-button {

                    position: fixed;

                    top: 20px;

                    right: 20px;

                    padding: 12px 18px;

                    background: #0b1220;

                    color: white;

                    border: 0;

                    border-radius: 7px;

                    cursor: pointer;

                }


                @media print {

                    body {

                        background: white;

                    }


                    .report {

                        margin: 0;

                        width: auto;

                        min-height: auto;

                    }


                    .print-button {

                        display: none;

                    }

                }

            </style>

        </head>


        <body>

            <button
                class="print-button"
                onclick="window.print()"
            >
                Print / Save PDF
            </button>


            <div class="report">

                <div class="header">

                    <h1>
                        ${escapeHTML(
                            teacherProfile?.school_name ||
                            "CLASSMARK SCHOOL"
                        )}
                    </h1>

                    <h2>
                        STUDENT ACADEMIC REPORT
                    </h2>

                    <p>
                        ${escapeHTML(
                            session
                        )}
                        ·
                        ${escapeHTML(
                            term
                        )}
                    </p>

                </div>


                <div class="student-info">

                    <div class="info-box">

                        <strong>
                            Student Name
                        </strong>

                        ${escapeHTML(
                            student.full_name
                        )}

                    </div>


                    <div class="info-box">

                        <strong>
                            Class
                        </strong>

                        ${escapeHTML(
                            student.class_name
                        )}

                    </div>


                    <div class="info-box">

                        <strong>
                            Gender
                        </strong>

                        ${escapeHTML(
                            student.gender
                        )}

                    </div>


                    <div class="info-box">

                        <strong>
                            Admission Number
                        </strong>

                        ${escapeHTML(
                            student.admission_number ||
                            "—"
                        )}

                    </div>

                </div>


                <table>

                    <thead>

                        <tr>

                            <th>#</th>

                            <th>Subject</th>

                            <th>CA / 60</th>

                            <th>Exam / 40</th>

                            <th>Total / 100</th>

                            <th>Grade</th>

                            <th>Remark</th>

                        </tr>

                    </thead>


                    <tbody>

                        ${
                            reportRows.map(
                                (row, index) => `

                                    <tr>

                                        <td>
                                            ${
                                                index + 1
                                            }
                                        </td>

                                        <td>
                                            ${escapeHTML(
                                                row.subject
                                            )}
                                        </td>

                                        <td>
                                            ${row.ca.toFixed(2)}
                                        </td>

                                        <td>
                                            ${row.exam.toFixed(2)}
                                        </td>

                                        <td>
                                            ${row.total.toFixed(2)}
                                        </td>

                                        <td>
                                            ${row.grade}
                                        </td>

                                        <td>
                                            ${escapeHTML(
                                                row.remark
                                            )}
                                        </td>

                                    </tr>

                                `
                            ).join("")
                        }

                    </tbody>

                </table>


                <div class="summary">

                    <div class="summary-box">

                        <strong>
                            ${total.toFixed(2)}
                        </strong>

                        Total

                    </div>


                    <div class="summary-box">

                        <strong>
                            ${average.toFixed(2)}
                        </strong>

                        Average

                    </div>


                    <div class="summary-box">

                        <strong>
                            ${passed}
                        </strong>

                        Passed

                    </div>


                    <div class="summary-box">

                        <strong
                            class="${
                                status === "PASS"
                                    ? "pass"
                                    : "fail"
                            }"
                        >
                            ${status}
                        </strong>

                        Overall Status

                    </div>

                </div>


                <div style="
                    margin-top:20px;
                    padding:15px;
                    border:1px solid #e5e7eb;
                    border-radius:8px;
                ">

                    <strong>
                        Attendance:
                    </strong>

                    Total Days:
                    ${
                        attendance?.total_school_days ||
                        0
                    }

                    &nbsp; | &nbsp;

                    Present:
                    ${
                        attendance?.present_days ||
                        0
                    }

                    &nbsp; | &nbsp;

                    Absent:
                    ${
                        attendance?.absent_days ||
                        0
                    }

                    &nbsp; | &nbsp;

                    Percentage:
                    ${
                        Number(
                            attendance?.attendance_percentage ||
                            0
                        ).toFixed(2)
                    }%

                </div>


                <div class="footer">

                    <div class="signature">
                        Teacher's Signature
                    </div>

                    <div class="signature">
                        Principal's Signature
                    </div>

                </div>

            </div>

        </body>

        </html>

    `);


    reportWindow.document.close();

}


// ==========================================
// GRADE ENGINE
// ==========================================

function getGrade(score) {

    score =
        Number(score || 0);


    if (score >= 70) return "A";

    if (score >= 60) return "B";

    if (score >= 50) return "C";

    if (score >= 45) return "D";

    if (score >= 40) return "E";

    return "F";

}


// ==========================================
// REMARK ENGINE
// ==========================================

function getRemark(score) {

    score =
        Number(score || 0);


    if (score >= 70)
        return "Excellent";


    if (score >= 60)
        return "Very Good";


    if (score >= 50)
        return "Good";


    if (score >= 45)
        return "Fair";


    if (score >= 40)
        return "Pass";


    return "Fail";

}


// ==========================================
// MANAGEMENT SECTION CLEANUP
// ==========================================

function removeManagementSections() {

    const ids = [

        "studentsSection",

        "subjectsSection",

        "marksSection",

        "attendanceSection",

        "resultsSection",

        "reportsSection"

    ];


    ids.forEach(
        id => {

            const element =
                document.getElementById(
                    id
                );


            if (element) {

                element.remove();

            }

        }
    );

}


// ==========================================
// MODULE MESSAGE
// ==========================================

function showModuleMessage(
    message,
    type = "success"
) {

    const element =
        document.querySelector(
            ".module-message"
        );


    if (!element) return;


    element.textContent =
        message;


    element.className =
        `module-message ${type}`;

}


// ==========================================
// SHARED MANAGEMENT STYLES
// ==========================================

function addManagementStyles() {

    if (
        document.getElementById(
            "classmarkManagementStyles"
        )
    ) {

        return;

    }


    const style =
        document.createElement("style");


    style.id =
        "classmarkManagementStyles";


    style.textContent = `

        .management-section {

            margin-top: 35px;

            padding: 30px;

            border-radius: 20px;

            background: #0f172a;

            border:
                1px solid
                rgba(255,255,255,.08);

        }


        .management-header {

            display:flex;

            justify-content:
                space-between;

            align-items:center;

            gap:20px;

            margin-bottom:25px;

        }


        .management-header h2 {

            margin:15px 0 8px;

        }


        .management-header p {

            margin:0;

            opacity:.7;

        }


        .management-toolbar,
        .marks-controls,
        .results-controls {

            display:flex;

            flex-wrap:wrap;

            align-items:end;

            gap:15px;

            padding:15px;

            margin-bottom:25px;

            border-radius:14px;

            background:#111827;

            border:
                1px solid
                rgba(255,255,255,.07);

        }


        .management-toolbar input,
        .marks-controls input,
        .marks-controls select,
        .results-controls select {

            padding:12px 14px;

            border-radius:10px;

            border:
                1px solid
                rgba(255,255,255,.12);

            background:#0b1220;

            color:white;

            font:inherit;

        }


        .marks-controls > div {

            display:flex;

            flex-direction:column;

            gap:7px;

            min-width:180px;

            flex:1;

        }


        .marks-controls label {

            font-size:13px;

            font-weight:700;

            opacity:.8;

        }


        .count-box {

            display:flex;

            align-items:baseline;

            gap:7px;

        }


        .count-box strong {

            font-size:24px;

            color:#d4af37;

        }


        .data-table-wrapper,
        .marks-table-wrapper {

            overflow-x:auto;

            border-radius:15px;

            border:
                1px solid
                rgba(255,255,255,.08);

        }


        .data-table,
        .marks-table {

            width:100%;

            min-width:850px;

            border-collapse:collapse;

            background:#111827;

        }


        .data-table th,
        .marks-table th {

            padding:14px;

            text-align:left;

            background:#0b1220;

            color:#d4af37;

            font-size:12px;

            text-transform:uppercase;

        }


        .data-table td,
        .marks-table td {

            padding:13px;

            border-top:
                1px solid
                rgba(255,255,255,.06);

            white-space:nowrap;

        }


        .data-table tr:hover,
        .marks-table tr:hover {

            background:
                rgba(255,255,255,.025);

        }


        .management-form {

            padding:25px;

            margin-bottom:25px;

            border-radius:18px;

            background:#111827;

            border:
                1px solid
                rgba(212,175,55,.2);

        }


        .management-form h3 {

            margin-top:0;

            margin-bottom:22px;

        }


        .form-grid {

            display:grid;

            grid-template-columns:
                repeat(2,1fr);

            gap:18px;

        }


        .form-grid > div {

            display:flex;

            flex-direction:column;

            gap:7px;

        }


        .form-grid label {

            font-weight:600;

        }


        .form-grid input,
        .form-grid select {

            width:100%;

            padding:12px 14px;

            border-radius:10px;

            border:
                1px solid
                rgba(255,255,255,.12);

            background:#0b1220;

            color:white;

            font:inherit;

        }


        .form-actions {

            display:flex;

            justify-content:flex-end;

            gap:12px;

            margin-top:22px;

        }


        .form-error {

            color:#ff9999;

            margin-top:13px;

        }


        .small-action {

            padding:7px 10px;

            border:0;

            border-radius:7px;

            background:
                rgba(212,175,55,.12);

            color:#e6c95c;

            cursor:pointer;

            font-weight:700;

            margin-right:5px;

        }


        .small-action.danger {

            background:
                rgba(239,68,68,.1);

            color:#fca5a5;

        }


        .empty-box,
        .loading-box,
        .error-box {

            padding:45px 20px;

            text-align:center;

            border-radius:15px;

            background:#111827;

            border:
                1px dashed
                rgba(255,255,255,.13);

        }


        .empty-box > div {

            font-size:40px;

            margin-bottom:10px;

        }


        .empty-box h3 {

            margin:8px 0;

        }


        .empty-box p {

            margin:0;

            opacity:.65;

        }


        .loading-box {

            opacity:.7;

        }


        .error-box {

            color:#ffaaaa;

            border-color:
                rgba(255,80,80,.25);

        }


        .module-message {

            padding:12px 15px;

            border-radius:9px;

            margin-bottom:15px;

            display:none;

        }


        .module-message.success {

            display:block;

            color:#86efac;

            background:
                rgba(34,197,94,.1);

        }


        .module-message.error {

            display:block;

            color:#fca5a5;

            background:
                rgba(239,68,68,.1);

        }


        .mark-input,
        .attendance-present {

            width:75px;

            padding:8px;

            border-radius:7px;

            border:
                1px solid
                rgba(255,255,255,.12);

            background:#0b1220;

            color:white;

            text-align:center;

        }


        .mark-total {

            color:#d4af37;

        }


        .marks-save-bar {

            display:flex;

            justify-content:
                space-between;

            align-items:center;

            gap:15px;

            margin-top:20px;

            padding:15px;

            border-radius:12px;

            background:#111827;

        }


        .marks-save-bar span {

            opacity:.7;

            font-size:13px;

        }


        .results-summary {

            display:grid;

            grid-template-columns:
                repeat(3,1fr);

            gap:15px;

            margin-bottom:20px;

        }


        .results-summary > div {

            padding:18px;

            border-radius:13px;

            background:#111827;

            border:
                1px solid
                rgba(255,255,255,.07);

            text-align:center;

        }


        .results-summary strong {

            display:block;

            font-size:25px;

            color:#d4af37;

        }


        .status-badge {

            display:inline-block;

            padding:5px 9px;

            border-radius:999px;

            font-size:11px;

            font-weight:800;

        }


        .status-pass {

            color:#86efac;

            background:
                rgba(34,197,94,.12);

        }


        .status-fail {

            color:#fca5a5;

            background:
                rgba(239,68,68,.12);

        }


        .report-student-grid {

            display:grid;

            grid-template-columns:
                repeat(2,1fr);

            gap:15px;

        }


        .report-student-card {

            display:flex;

            align-items:center;

            gap:15px;

            padding:18px;

            border-radius:14px;

            background:#111827;

            border:
                1px solid
                rgba(255,255,255,.07);

        }


        .report-avatar {

            width:45px;

            height:45px;

            border-radius:50%;

            display:grid;

            place-items:center;

            background:#d4af37;

            color:#0b1220;

            font-weight:900;

            flex-shrink:0;

        }


        .report-student-card > div:nth-child(2) {

            flex:1;

        }


        .report-student-card h3 {

            margin:0 0 5px;

            font-size:15px;

        }


        .report-student-card p {

            margin:0;

            font-size:12px;

            opacity:.65;

        }


        @media(max-width:700px) {

            .management-section {

                padding:20px;

            }


            .management-header {

                align-items:
                    flex-start;

                flex-direction:column;

            }


            .management-header .primary-btn {

                width:100%;

            }


            .form-grid {

                grid-template-columns:1fr;

            }


            .form-actions {

                flex-direction:column;

            }


            .form-actions button {

                width:100%;

            }


            .marks-save-bar {

                align-items:
                    flex-start;

                flex-direction:column;

            }


            .marks-save-bar button {

                width:100%;

            }


            .results-summary {

                grid-template-columns:1fr;

            }


            .report-student-grid {

                grid-template-columns:1fr;

            }


            .report-student-card {

                align-items:
                    flex-start;

                flex-wrap:wrap;

            }

        }

    `;


    document.head.appendChild(style);

}


// ==========================================
// HTML SAFETY
// ==========================================

function escapeHTML(value) {

    return String(
        value ?? ""
    )

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}