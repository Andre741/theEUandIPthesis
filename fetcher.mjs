import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';
import fs from 'fs';

let results = {};

const start = 60;
const end = 79;

console.log("Fetching data from IETF");

async function fetchHTMLTableAsJSON(url) {
  const response = await fetch(url);
  const html = await response.text();
  const { window } = new JSDOM(html);
  try {
    const table = window.document.querySelectorAll('table')[0];
    const headerRow = table.querySelector('tr:first-child');
    const headers = Array.from(headerRow.querySelectorAll('td')).map(td => td.textContent.trim());
    const rows = [...table.querySelectorAll('tbody > tr')].map(tr =>
      [...tr.querySelectorAll('td')].reduce((obj, td, i) => {
        obj[headers[i]] = td.textContent.trim();
        return obj;
      }, {})
    );

    const json = JSON.stringify(rows);
    return json;
  } catch (error) {
    console.log(error);
    console.log(window.document.querySelectorAll('body')[0]);
    throw new Error('Error parsing table');
  }
}

async function processArray(array) {
  for (const item of array) {
    // Perform some async operation
    try {
      let json = await fetchHTMLTableAsJSON('https://www.ietf.org/proceedings/' + item + '/attendee.html')
      await delay(1000);
      results["meeting " + item] = count(JSON.parse(json))
      console.log('finished meeting ' + item);
    } catch (error) {
      console.log(error);
      console.log('error in meeting ' + item);
    }
  }
}

let myArray = [];

// iterate over 116 meeting
for (let i = start; i <= end; i++) {
  myArray.push(i);
}

const writeToFile = (data) => {
  const toPrint = JSON.stringify(data);

  fs.writeFile(`myIETFdata${start}to${end}.json`, toPrint, (err) => {
    if (err) throw err;
    console.log('Data written to file');
  });
}

// make a arrow function with the name count
const count = (table) => {
  let countries = {};
  for (let entry of table) {
    const country = entry["ISO 3166 Code"];
    // group the countries and count participants
    if (country in countries) {
      countries[country] += 1;
    }
    else {
      countries[country] = 1;
    }
  }
  return countries;
}
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

(async () => {
  // Process the array using the processArray function
  await processArray(myArray);

  // All async tasks have completed at this point
  console.log('All async tasks have completed');
  writeToFile(results);
})();