describe('My First Test', () => {
    it('example', () => {

        cy.visit('localhost:8080/NTIBusScreen/') 
        cy.contains('Lundellska skolan')
      
    })
})   

