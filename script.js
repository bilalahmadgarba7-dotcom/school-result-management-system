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