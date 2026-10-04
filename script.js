// ==========================================
// CLASSMARK
// School Result Management System
// ==========================================


// ------------------------------------------
// SUPABASE CONFIGURATION
// ------------------------------------------

const SUPABASE_URL =
    "https://wzqcjbuotsipshjgrboo.supabase.co";

const SUPABASE_PUBLIC_KEY =
    "sb_publishable_qwB02PL2sdF7gHDOjXgJpA_-d_W4o6m";


// ------------------------------------------
// SUPABASE CLIENT
// ------------------------------------------

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLIC_KEY
    );


// ------------------------------------------
// APPLICATION STATE
// ------------------------------------------

let currentUser = null;
let teacherProfile = null;


// ------------------------------------------
// APP START
// ------------------------------------------

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        console.log(
            "ClassMark application started."
        );

        await checkAuthentication();

    }
);


// ------------------------------------------
// CHECK AUTHENTICATION
// ------------------------------------------

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


// ------------------------------------------
// AUTH STATE LISTENER
// ------------------------------------------

supabaseClient
    .auth
    .onAuthStateChange(
        function (event, session) {

            console.log(
                "Auth event:",
                event
            );


            if (session) {

                currentUser =
                    session.user;

            } else {

                currentUser = null;
                teacherProfile = null;

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


        console.log(
            "Login successful:",
            currentUser.email
        );


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

        console.warn(
            "Cannot load teacher profile: no authenticated user."
        );

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

            console.warn(
                "No teacher profile found."
            );

            alert(
                "Your teacher profile was not found."
            );

            return null;
        }


        teacherProfile = data;


        console.log(
            "Teacher profile loaded:",
            teacherProfile
        );


        return teacherProfile;


    } catch (error) {

        console.error(
            "Unexpected teacher profile error:",
            error
        );

        alert(
            "Something went wrong while loading your profile."
        );

        return null;
    }

}


// ==========================================
// TEACHER DASHBOARD
// ==========================================

function showTeacherDashboard() {

    const loginModal =
        document.getElementById("loginModal");


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
                            teacherProfile?.class_name ||
                            "-"
                        )}
                    </strong>

                    &nbsp; | &nbsp;

                    Session:

                    <strong>
                        ${escapeHTML(
                            teacherProfile?.session ||
                            "-"
                        )}
                    </strong>

                    &nbsp; | &nbsp;

                    Term:

                    <strong>
                        ${escapeHTML(
                            teacherProfile?.term ||
                            "-"
                        )}
                    </strong>

                </p>

            </div>


            <div class="dashboard-cards">


                <!-- STUDENTS -->

                <button
                    type="button"
                    class="dashboard-card dashboard-card-button"
                    onclick="showStudents()"
                >

                    <span>
                        👨‍🎓
                    </span>

                    <h3>
                        Students
                    </h3>

                    <p>
                        Add and manage your students.
                    </p>

                </button>


                <!-- SUBJECTS -->

                <button
                    type="button"
                    class="dashboard-card dashboard-card-button"
                    onclick="showSubjectsComingSoon()"
                >

                    <span>
                        📚
                    </span>

                    <h3>
                        Subjects
                    </h3>

                    <p>
                        Manage class subjects.
                    </p>

                </button>


                <!-- MARKS -->

                <button
                    type="button"
                    class="dashboard-card dashboard-card-button"
                    onclick="showMarksComingSoon()"
                >

                    <span>
                        📝
                    </span>

                    <h3>
                        Marks
                    </h3>

                    <p>
                        Enter student assessments.
                    </p>

                </button>


                <!-- RESULTS -->

                <button
                    type="button"
                    class="dashboard-card dashboard-card-button"
                    onclick="showResultsComingSoon()"
                >

                    <span>
                        📊
                    </span>

                    <h3>
                        Results
                    </h3>

                    <p>
                        Generate academic results.
                    </p>

                </button>


            </div>

        </div>

    `;


    document
        .querySelector("main")
        .appendChild(dashboard);


    addDashboardStyles();

}


// ==========================================
// COMING SOON ACTIONS
// ==========================================

function showSubjectsComingSoon() {

    alert(
        "Subjects Management will be added next."
    );

}


function showMarksComingSoon() {

    alert(
        "Marks Management will be added soon."
    );

}


function showResultsComingSoon() {

    alert(
        "Results Management will be added soon."
    );

}


// ==========================================
// LOGOUT TEACHER
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
                "Unable to logout. Please try again."
            );

            return;
        }


        currentUser = null;

        teacherProfile = null;


        const dashboard =
            document.getElementById(
                "teacherDashboard"
            );


        if (dashboard) {

            dashboard.remove();

        }


        console.log(
            "Teacher logged out."
        );


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

            padding:
                50px 20px 80px;

        }


        .dashboard-topbar {

            display: flex;

            justify-content:
                space-between;

            align-items: center;

            gap: 20px;

            margin-bottom: 35px;

        }


        .dashboard-topbar h2 {

            margin:
                0 0 8px;

        }


        .dashboard-topbar p {

            margin: 0;

            opacity: 0.75;

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
                rgba(
                    212,
                    175,
                    55,
                    0.25
                );

        }


        .dashboard-welcome h1 {

            margin:
                15px 0 10px;

        }


        .dashboard-welcome p {

            margin: 0;

            line-height: 1.7;

        }


        .dashboard-cards {

            display: grid;

            grid-template-columns:
                repeat(4, 1fr);

            gap: 20px;

        }


        .dashboard-card {

            padding: 28px;

            border-radius: 18px;

            background:
                #111827;

            border:
                1px solid
                rgba(
                    255,
                    255,
                    255,
                    0.08
                );

            transition:
                transform 0.2s ease,
                border-color 0.2s ease,
                box-shadow 0.2s ease;

        }


        .dashboard-card:hover {

            transform:
                translateY(-4px);

            border-color:
                rgba(
                    212,
                    175,
                    55,
                    0.5
                );

            box-shadow:
                0 12px 30px
                rgba(
                    0,
                    0,
                    0,
                    0.18
                );

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
                rgba(
                    212,
                    175,
                    55,
                    0.7
                );

            outline-offset: 3px;

        }


        .dashboard-card span {

            font-size: 28px;

        }


        .dashboard-card h3 {

            margin:
                16px 0 8px;

        }


        .dashboard-card p {

            margin: 0;

            opacity: 0.7;

            line-height: 1.6;

        }


        @media (max-width: 850px) {

            .dashboard-cards {

                grid-template-columns:
                    repeat(2, 1fr);

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

                grid-template-columns:
                    1fr;

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

        alert(
            "Please login first."
        );

        return;
    }


    const dashboard =
        document.getElementById(
            "teacherDashboard"
        );


    if (!dashboard) {

        return;

    }


    const existing =
        document.getElementById(
            "studentsSection"
        );


    if (existing) {

        existing.remove();

    }


    const section =
        document.createElement("section");


    section.id =
        "studentsSection";


    section.className =
        "students-section";


    section.innerHTML = `

        <div class="students-header">

            <div>

                <span class="hero-badge">
                    STUDENT MANAGEMENT
                </span>


                <h2>
                    Students
                </h2>


                <p>
                    Add and manage students in your class.
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


        <div
            id="studentFormContainer"
            class="student-form-container"
            style="display:none;"
        >

            <form
                id="studentForm"
                onsubmit="saveStudent(event)"
            >

                <div class="form-grid">


                    <div>

                        <label for="studentName">
                            Full Name
                        </label>

                        <input
                            type="text"
                            id="studentName"
                            placeholder="Enter student's full name"
                            required
                        >

                    </div>


                    <div>

                        <label for="studentGender">
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

                        <label for="studentDob">
                            Date of Birth
                        </label>

                        <input
                            type="date"
                            id="studentDob"
                        >

                    </div>


                    <div>

                        <label for="studentAdmission">
                            Admission Number
                        </label>

                        <input
                            type="text"
                            id="studentAdmission"
                            placeholder="e.g. CM/001"
                        >

                    </div>


                    <div>

                        <label for="studentClass">
                            Class
                        </label>

                        <input
                            type="text"
                            id="studentClass"
                            required
                        >

                    </div>


                    <div>

                        <label for="studentSession">
                            Academic Session
                        </label>

                        <input
                            type="text"
                            id="studentSession"
                            placeholder="e.g. 2026/2027"
                            required
                        >

                    </div>


                    <div>

                        <label for="studentTerm">
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
                    >
                        Save Student
                    </button>

                </div>

            </form>

        </div>


        <div
            id="studentsList"
            class="students-list"
        >

            <div class="students-loading">
                Loading students...
            </div>

        </div>

    `;


    dashboard.appendChild(section);


    addStudentsStyles();


    await loadStudents();

}


// ==========================================
// STUDENT FORM
// ==========================================

function openStudentForm() {

    const formContainer =
        document.getElementById(
            "studentFormContainer"
        );


    if (!formContainer) {

        return;

    }


    document
        .getElementById("studentForm")
        .reset();


    document
        .getElementById("studentClass")
        .value =
            teacherProfile?.class_name || "";


    document
        .getElementById("studentSession")
        .value =
            teacherProfile?.session || "";


    document
        .getElementById("studentTerm")
        .value =
            teacherProfile?.term || "";


    document
        .getElementById("studentFormError")
        .textContent = "";


    formContainer.style.display =
        "block";

}


// ------------------------------------------
// CLOSE STUDENT FORM
// ------------------------------------------

function closeStudentForm() {

    const formContainer =
        document.getElementById(
            "studentFormContainer"
        );


    if (formContainer) {

        formContainer.style.display =
            "none";

    }

}


// ==========================================
// SAVE STUDENT
// ==========================================

async function saveStudent(event) {

    event.preventDefault();


    if (!currentUser) {

        showStudentFormError(
            "You must be logged in."
        );

        return;
    }


    const fullName =
        document
            .getElementById("studentName")
            .value
            .trim();


    const gender =
        document
            .getElementById("studentGender")
            .value;


    const dateOfBirth =
        document
            .getElementById("studentDob")
            .value ||
        null;


    const admissionNumber =
        document
            .getElementById("studentAdmission")
            .value
            .trim() ||
        null;


    const className =
        document
            .getElementById("studentClass")
            .value
            .trim();


    const session =
        document
            .getElementById("studentSession")
            .value
            .trim();


    const term =
        document
            .getElementById("studentTerm")
            .value;


    if (!fullName) {

        showStudentFormError(
            "Please enter the student's name."
        );

        return;
    }


    if (!gender) {

        showStudentFormError(
            "Please select the student's gender."
        );

        return;
    }


    if (!className) {

        showStudentFormError(
            "Please enter the class."
        );

        return;
    }


    if (!session) {

        showStudentFormError(
            "Please enter the academic session."
        );

        return;
    }


    if (!term) {

        showStudentFormError(
            "Please select the term."
        );

        return;
    }


    const submitButton =
        document.querySelector(
            "#studentForm button[type='submit']"
        );


    if (submitButton) {

        submitButton.disabled = true;

        submitButton.textContent =
            "Saving...";

    }


    try {

        const {
            error
        } =
            await supabaseClient
                .from("students")
                .insert([
                    {

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

                    }
                ]);


        if (error) {

            console.error(
                "Student insert error:",
                error
            );

            showStudentFormError(
                "Unable to save student. Please try again."
            );

            return;
        }


        closeStudentForm();


        await loadStudents();


    } catch (error) {

        console.error(
            "Unexpected student save error:",
            error
        );

        showStudentFormError(
            "Something went wrong. Please try again."
        );


    } finally {

        if (submitButton) {

            submitButton.disabled = false;

            submitButton.textContent =
                "Save Student";

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


    if (!list || !currentUser) {

        return;

    }


    try {

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
                    term,
                    created_at
                `)
                .eq(
                    "teacher_id",
                    currentUser.id
                )
                .order(
                    "full_name",
                    {
                        ascending: true
                    }
                );


        if (error) {

            console.error(
                "Student loading error:",
                error
            );


            list.innerHTML = `

                <p class="form-error">
                    Unable to load students.
                </p>

            `;

            return;
        }


        renderStudents(
            data || []
        );


    } catch (error) {

        console.error(
            "Unexpected student loading error:",
            error
        );

    }

}


// ==========================================
// RENDER STUDENTS
// ==========================================

function renderStudents(students) {

    const list =
        document.getElementById(
            "studentsList"
        );


    if (!list) {

        return;

    }


    if (!students.length) {

        list.innerHTML = `

            <div class="empty-students">

                <div class="empty-icon">
                    👨‍🎓
                </div>

                <h3>
                    No students yet
                </h3>

                <p>
                    Add your first student to begin
                    managing your class.
                </p>

            </div>

        `;

        return;
    }


    list.innerHTML = `

        <div class="students-table-wrapper">

            <table class="students-table">

                <thead>

                    <tr>

                        <th>
                            #
                        </th>

                        <th>
                            Student
                        </th>

                        <th>
                            Gender
                        </th>

                        <th>
                            Admission No.
                        </th>

                        <th>
                            Class
                        </th>

                        <th>
                            Session
                        </th>

                        <th>
                            Term
                        </th>

                    </tr>

                </thead>


                <tbody>

                    ${students
                        .map(
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

                                    ${
                                        student.admission_number
                                            ? escapeHTML(
                                                student.admission_number
                                            )
                                            : "—"
                                    }

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

                            </tr>

                        `
                        )
                        .join("")}

                </tbody>

            </table>

        </div>

    `;

}


// ==========================================
// STUDENT FORM ERROR
// ==========================================

function showStudentFormError(message) {

    const error =
        document.getElementById(
            "studentFormError"
        );


    if (error) {

        error.textContent =
            message;

    }

}


// ==========================================
// STUDENTS STYLES
// ==========================================

function addStudentsStyles() {

    if (
        document.getElementById(
            "classmarkStudentsStyles"
        )
    ) {

        return;

    }


    const style =
        document.createElement("style");


    style.id =
        "classmarkStudentsStyles";


    style.textContent = `

        .students-section {

            margin-top: 35px;

            padding:
                30px;

            border-radius:
                20px;

            background:
                #0f172a;

            border:
                1px solid
                rgba(
                    255,
                    255,
                    255,
                    0.08
                );

        }


        .students-header {

            display:
                flex;

            justify-content:
                space-between;

            align-items:
                center;

            gap:
                20px;

            margin-bottom:
                30px;

        }


        .students-header h2 {

            margin:
                15px 0 8px;

        }


        .students-header p {

            margin:
                0;

            opacity:
                0.7;

        }


        .student-form-container {

            margin-bottom:
                30px;

            padding:
                25px;

            border-radius:
                18px;

            background:
                #111827;

            border:
                1px solid
                rgba(
                    212,
                    175,
                    55,
                    0.2
                );

        }


        .form-grid {

            display:
                grid;

            grid-template-columns:
                repeat(2, 1fr);

            gap:
                20px;

        }


        .form-grid > div {

            display:
                flex;

            flex-direction:
                column;

            gap:
                8px;

        }


        .form-grid label {

            font-weight:
                600;

        }


        .form-grid input,
        .form-grid select {

            width:
                100%;

            padding:
                13px 14px;

            border-radius:
                10px;

            border:
                1px solid
                rgba(
                    255,
                    255,
                    255,
                    0.12
                );

            background:
                #0b1220;

            color:
                #ffffff;

            font: inherit;

            box-sizing:
                border-box;

        }


        .form-grid input:focus,
        .form-grid select:focus {

            outline:
                none;

            border-color:
                #d4af37;

            box-shadow:
                0 0 0 3px
                rgba(
                    212,
                    175,
                    55,
                    0.12
                );

        }


        .form-actions {

            display:
                flex;

            justify-content:
                flex-end;

            gap:
                12px;

            margin-top:
                25px;

        }


        .form-error {

            margin-top:
                15px;

            color:
                #ff8a8a;

            font-size:
                14px;

        }


        .students-list {

            width:
                100%;

        }


        .students-loading {

            padding:
                30px;

            text-align:
                center;

            opacity:
                0.7;

        }


        .empty-students {

            padding:
                50px 20px;

            text-align:
                center;

            border-radius:
                16px;

            background:
                #111827;

            border:
                1px dashed
                rgba(
                    255,
                    255,
                    255,
                    0.15
                );

        }


        .empty-icon {

            font-size:
                42px;

            margin-bottom:
                12px;

        }


        .empty-students h3 {

            margin:
                0 0 8px;

        }


        .empty-students p {

            margin:
                0;

            opacity:
                0.65;

        }


        .students-table-wrapper {

            width:
                100%;

            overflow-x:
                auto;

            border-radius:
                16px;

            border:
                1px solid
                rgba(
                    255,
                    255,
                    255,
                    0.08
                );

        }


        .students-table {

            width:
                100%;

            min-width:
                760px;

            border-collapse:
                collapse;

            background:
                #111827;

        }


        .students-table th {

            padding:
                15px;

            text-align:
                left;

            background:
                #0b1220;

            color:
                #d4af37;

            font-size:
                13px;

            text-transform:
                uppercase;

            letter-spacing:
                0.04em;

        }


        .students-table td {

            padding:
                15px;

            border-top:
                1px solid
                rgba(
                    255,
                    255,
                    255,
                    0.06
                );

            white-space:
                nowrap;

        }


        .students-table tbody tr:hover {

            background:
                rgba(
                    255,
                    255,
                    255,
                    0.025
                );

        }


        @media (max-width: 700px) {

            .students-section {

                padding:
                    20px;

            }


            .students-header {

                align-items:
                    flex-start;

                flex-direction:
                    column;

            }


            .students-header .primary-btn {

                width:
                    100%;

            }


            .form-grid {

                grid-template-columns:
                    1fr;

            }


            .form-actions {

                flex-direction:
                    column;

            }


            .form-actions button {

                width:
                    100%;

            }

        }

    `;


    document.head.appendChild(style);

}


// ==========================================
// HTML SAFETY
// ==========================================

function escapeHTML(value) {

    return String(value ?? "")

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