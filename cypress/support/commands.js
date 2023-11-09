// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

// Add this to your Cypress commands (in commands.js or support/index.js)


import { google } from "googleapis";

Cypress.Commands.add("getGoogleSheetData", async () => {
    const auth = new google.auth.GoogleAuth({
      keyFile: 'credentials.json',
      scopes: "https://www.googleapis.com/auth/spreadsheets",
    });
    return auth.getClient()
      .then((client) => {
        const googleSheets = google.sheets({ version: "v4", auth: client });
        const spreadsheetId = "1XW0cmrudu_FTS7BwioJpQsrJeMvYy6J3tYoabZkbcKY";
        return googleSheets.spreadsheets.values.get({
          auth,
          spreadsheetId,
          range: "sheet1!B2:D100",
        });
      })
      .then((getRows) => getRows.data["values"]);
   });
   // Use the custom command in your test
   describe('Tests', () => {
    it('correctBusShown', () => {
      cy.visit('127.0.0.1:8080/NTIBusScreen');
      cy.getGoogleSheetData().then((sheetInput) => {
        for (let i = 0; i < sheetInput.length; i++) {
          cy.log('tjena');
          cy.log(sheetInput[i][2]); 
          cy.contains(sheetInput[i][2]);
        }
      });
    });
   });