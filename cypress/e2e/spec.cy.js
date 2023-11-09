describe('Tests', () => {
    it('correctTimes', () => {      
        cy.visit('127.0.0.1:8080/NTIBusScreen/12:18:40')    
        cy.contains('[{"stopId":"9022003700218003","stopName":"Uppsala Lundellska skolan","headsign":"Boländerna Gränbystaden","upcomingBusses":[{"arrivalTime":"12:22:20"},{"arrivalTime":"12:23:20"},{"arrivalTime":"12:39:20"}]},{"stopId":"9022003700218004","stopName":"Uppsala Lundellska skolan","headsign":"Rosendal Akademiska sjukhuset","upcomingBusses":[{"arrivalTime":"12:26:47"},{"arrivalTime":"12:38:23"},{"arrivalTime":"12:40:47"}]},{"stopId":"9022003700021001","stopName":"Uppsala Regementsvägen","headsign":"Nyby","upcomingBusses":[{"arrivalTime":"12:20:17"},{"arrivalTime":"12:32:17"},{"arrivalTime":"12:33:04"}]},{"stopId":"9022003700021002","stopName":"Uppsala Regementsvägen","headsign":"Östra Gottsunda","upcomingBusses":[{"arrivalTime":"12:26:00"},{"arrivalTime":"12:28:00"},{"arrivalTime":"12:40:00"}]},{"stopId":"9022003700572001","stopName":"Uppsala Polacksbacken","headsign":"Gränbystaden Norra Årsta","upcomingBusses":[{"arrivalTime":"12:28:00"},{"arrivalTime":"12:34:00"},{"arrivalTime":"12:40:00"}]},{"stopId":"9022003700572002","stopName":"Uppsala Polacksbacken","headsign":"Ultuna Gottsunda","upcomingBusses":[{"arrivalTime":"12:24:33"},{"arrivalTime":"12:33:21"},{"arrivalTime":"12:36:33"}]},{"stopId":"9022003700021001","stopName":"Uppsala Regementsvägen","headsign":"Ärna","upcomingBusses":[{"arrivalTime":"12:21:00"},{"arrivalTime":"12:36:00"},{"arrivalTime":"12:37:00"}]},{"stopId":"9022003700021002","stopName":"Uppsala Regementsvägen","headsign":"Sunnersta","upcomingBusses":[{"arrivalTime":"12:26:00"},{"arrivalTime":"12:36:00"},{"arrivalTime":"12:41:00"}]},{"stopId":"9022003700021001","stopName":"Uppsala Regementsvägen","headsign":"Fyrislund","upcomingBusses":[{"arrivalTime":"12:24:51"},{"arrivalTime":"12:25:02"},{"arrivalTime":"12:40:02"}]},{"stopId":"9022003700021002","stopName":"Uppsala Regementsvägen","headsign":"Vårdsätra Gottsunda","upcomingBusses":[{"arrivalTime":"12:26:46"},{"arrivalTime":"12:41:46"},{"arrivalTime":"12:46:46"}]},{"stopId":"9022003700572001","stopName":"Uppsala Polacksbacken","headsign":"Eriksberg Flogsta Stenhagen","upcomingBusses":[{"arrivalTime":"12:23:00"},{"arrivalTime":"12:43:00"},{"arrivalTime":"13:03:00"}]},{"stopId":"9022003700572002","stopName":"Uppsala Polacksbacken","headsign":"Ultuna","upcomingBusses":[{"arrivalTime":"12:30:54"},{"arrivalTime":"12:50:54"},{"arrivalTime":"13:10:54"}]}]')
        cy.contains("Uppsala Lundellska skolan")
    })
    
    it('correctBusShown', ()  => {
        cy.visit('127.0.0.1:8080/NTIBusScreen')

        cy.getGoogleSheetData().then((sheetInput) => {
            for (let i = 0; i < sheetInput.length; i++) {
              cy.log('tjena');
              cy.log(sheetInput[i][2]);
              cy.contains(sheetInput[i][2]);
            }
        })
    })
})   



