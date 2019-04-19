const canvas = require('canvas-api-wrapper');
const chalk = require('chalk');

// TODO: Find a better way to get this number here from bin.js
// var term_id = process.argv[2] || 23;
const term_id = 23;

// error handling
async function errorHandling(error) { console.error(chalk.red(error.message)) };

// check to ensure the course is NOT in the correct term
function isIncorrectTerm(course, term) {
    if (course.enrollment_term_id !== term) {
        console.log(chalk.green(`Course ${course.id} is currently of enrollment term ${course.enrollment_term_id}`));
        return true;
    } else {
        console.log(chalk.red(`Course ${course.id} is already of enrollment term ${course.enrollment_term_id}`));
        return false;
    }
}

// makes the put request to change the enrollment term ID
// TODO: Find a way to make this actually await... It will still tell you whether it worked but only after everything else has run...
async function setTerm(course, term) {
    // start at the current enrollment_term_id
    var newTerm = course.enrollment_term_id;

    // try to make the request and return the new term id if we successfully change
    try {
        await canvas.put(`https://byui.instructure.com/api/v1/courses/${course.id}?course[term_id]=${term}`, err => {
            if (err) throw new Error(`Error putting term id ${term} for ${course.id}`);

            console.log(chalk.green(`Successfully set term id ${term} for ${course.id}`));
            newTerm = term;
        });
        return newTerm;

    } catch (error) {
        // otherwise return the old term id
        errorHandling(error);
        return newTerm;
    }
}

// Actual function call
async function doStuff(course, i) {
    var report = {
        id: course.id,
        name: course.name,
        sis_course_id: course.sis_course_id,
        enrollment_term_id: course.enrollment_term_id
    };

    // if we are NOT in the correct term, go ahead and make the API call, otherwise we're already done.
    if (isIncorrectTerm(course, term_id)) {
        report.enrollment_term_id = await setTerm(course, term_id);
    }
    return report;
}

module.exports = {
    doStuff: doStuff
};