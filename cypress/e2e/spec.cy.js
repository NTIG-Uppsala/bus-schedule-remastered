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
                    console.log(bus.Bussnamn)
                    cy.contains(bus.Bussnamn);
                }
            }
        })
    });

    it('nextBusListNotEmpty', () => {
        cy.visit('127.0.0.1:8080/NTIBusScreen/2023-11-08T23:59:59');
        cy.contains('"upcomingBusses":[]').should('not.exist');
    });
});