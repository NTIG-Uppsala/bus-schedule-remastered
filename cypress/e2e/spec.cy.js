// Run npm start berfore running tests

describe('Tests', () => {
    const jsonName = 'busData.json';
    beforeEach(() => {
        cy.fixture(jsonName).as('busData');
    });
    it('correctBuses', () => {
        cy.visit('127.0.0.1:8080/NTIBusScreen/');
        cy.get('@busData').then((busData) => {
            for (const bus of busData) {
                if (bus.Bussnamn != undefined) {
                    cy.contains(bus.Bussnamn);
                }
            }
        })
    });

    it('nextBusIsRight', () => {
        cy.visit('127.0.0.1:8080/NTIBusScreen/2023-11-15T09:00:00');
        cy.contains('7 min')
        cy.contains('Nästa 09:16')
        cy.contains('nu')
        cy.contains('Nästa 09:10')
    });

    it('testRealTimeData', () => {
        cy.visit('127.0.0.1:8080/NTIBusScreen/2023-11-17T11:28:00');
        cy.contains('Nästa 11:50')
    });

    it('testCancelledBus', () => {
        cy.visit('127.0.0.1:8080/NTIBusScreen/2023-11-17T11:28:00');
        cy.contains('15 min')
        cy.contains('Nästa 12:03')
    });
});