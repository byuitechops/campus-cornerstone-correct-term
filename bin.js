const { prompt } = require('inquirer');
const main = require('./main.js');
const pMap = require('p-map');
const canvas = require('canvas-api-wrapper');
const dsv = require('d3-dsv');
const fs = require('fs');
const path = require('path');

// CURRENT REL-C COURSE CODES
const codes = [
    'REL+200C',
    'REL+225C',
    'REL+250C',
    'REL+275C',
];

// ASK FOR CURRENT TERM TO CREATE COURSE SIS ID
async function getInput() {
    const questions = [
        {
            type: 'list',
            name: 'term',
            message: 'What term is this?',
            choices: [
                'Fall',
                'Winter',
                'Spring'
            ],
            default: 'Spring'
        }, {
            type: 'number',
            name: 'year',
            message: 'What school year is this',
            suffix: ':',
            default: 2019,
            validate: num => { return num >= 2019 ? true : false; }
        }
    ];
    var answers = await prompt(questions);
    var courses = codes.map(code => {
        return `C.Campus.${answers.year}.${answers.term}.${code}`;
    });
    return courses;
}

// CALL TO GET ALL CANVAS COURSES FITTING THE COURSE SIS ID'S GIVEN
async function getCourses(course_sis_id) {
    return await canvas.get(`https://byui.instructure.com/api/v1/accounts/1/courses?search_term=${course_sis_id}&search_by=course&include[]=term`);
}

// LOOP TO CALL GETCOURSES() AND MAIN()
async function loop(sis_ids) {
    var courses = await pMap(sis_ids, getCourses, { concurrency: 1 });
    courses = courses.reduce((acc, val) => acc.concat(val), [])
    // .slice(0, 5);
    // return [main.doStuff(courses[2])];
    return await pMap(courses, main.doStuff, { concurrency: 1 });
}

function printOutput(reports) {
    console.log("REQUESTS COMPLETE: Now writing report.");
    var csvData = dsv.csvFormat(reports);
    fs.writeFileSync(path.resolve(`./reports/report_${Date.now()}.csv`), csvData);
}

function handleError(error) {
    console.error(error)
    return;
}


// start promise chain
async function start() {
    try {
        var courses = await getInput();
        var reports = await loop(courses);
        printOutput(reports);
    } catch (error) {
        handleError(error);
    }
}

start();