describe('aslp-web tests', () => {
  it('synchronises with big-endian input', () => {
    // cy.intercept('GET', 'aslp.heap').as('heap');
    cy.aslpweb().then(() => {
      cy.getByLabel('big-endian').type('{selectall}0xaa030041').then(x => {
        cy.getByLabel('assembly').should('have.value', 'orr x1, x2, x3');
        cy.getByLabel('little-endian').should('have.value', '41 00 03 AA');
      });
    });
  });

  it('synchronises with little-endian input', () => {
    cy.aslpweb().then(() => {
      cy.getByLabel('little-endian').type('{selectall}41 00 03 AA').then(x => {
        cy.getByLabel('big-endian').should('have.value', '0xaa030041');
        cy.getByLabel('assembly').should('have.value', 'orr x1, x2, x3');
      });
    });
  });

  it('synchronises with asm input', () => {
    cy.aslpweb().then(() => {
      cy.getByLabel('assembly').type('{selectall}orr x1, x2, x3').then(x => {
        cy.getByLabel('big-endian').should('have.value', '0xaa030041');
        cy.getByLabel('little-endian').should('have.value', '41 00 03 AA');
      });
    });
  });

  it('disassembles', () => {
    cy.aslpweb().then(() => {
      cy.getByLabel('big-endian').type('{selectall}0xaa030041').then(x => {
        cy.get('button[type=submit]').click().then(x => {
          cy.get('#output').should('contain', 'aarch64_integer_logical_shiftedreg').and('contain', 'or_bits');
        });
      });
    });
  });

  it('parses options from url', () => {
    cy.aslpweb('?opcode=0xaa030041&bytes=41+00+03+AA&asm=orr+x1%2C+x2%2C+x3&debug=1').then(() => {
      cy.get('#output').should('contain', 'aarch64_integer_logical_shiftedreg').and('contain', 'or_bits').and('contain', 'dis_decode_case');
    });
  });

})
