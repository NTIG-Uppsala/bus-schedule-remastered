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

    it('nextBusListNotEmpty', () => {
        cy.visit('127.0.0.1:8080/NTIBusScreen/2023-11-08T23:59:59');
        cy.contains('"upcomingBuses":[]').should('not.exist');
    });

    it('nextBusIsRight', () => {
        cy.visit('127.0.0.1:8080/NTIBusScreen/2023-11-15T09:00:00');
        cy.contains('Ärna","upcomingBuses":[{"departureTime":"09:08:00"},{"departureTime":"09:21:00"}]}')
        cy.contains('Fyrislund","upcomingBuses":[{"departureTime":"09:00:02"},{"departureTime":"09:10:02"}]}')
    });

    it('testRealTimeData', () => {
        cy.visit('127.0.0.1:8080/NTIBusScreen/2023-11-17T11:28:00');
        cy.contains('Nyby","upcomingBuses":[{"departureTime":"11:33:34"},{"departureTime":"11:54:27"}]}')
    });
});