
const opcodes = [
  { asm: 'orr x1, x2, x3', big: '0xaa030041', little: '41 00 03 AA' },
  { asm: 'orr x1, x2, x5', big: '0xaa050041', little: '41 00 05 AA' },
  { asm: 'orr x1, x2, x10', big: '0xaa0a0041', little: '41 00 0A AA' },
];

describe('aslp-web tests', () => {
  it('synchronises valid inputs', () => {
    cy.aslpweb();

    cy.getByLabel('big-endian').type('{selectall}' + opcodes[0].big);
    cy.getByLabel('assembly').should('have.value', opcodes[0].asm);
    cy.getByLabel('little-endian').should('have.value', opcodes[0].little);

    cy.getByLabel('little-endian').type('{selectall}' + opcodes[1].little);
    cy.getByLabel('big-endian').should('have.value', opcodes[1].big);
    cy.getByLabel('assembly').should('have.value', opcodes[1].asm);

    cy.getByLabel('assembly').type('{selectall}' + opcodes[2].asm);
    cy.getByLabel('big-endian').should('have.value', opcodes[2].big);
    cy.getByLabel('little-endian').should('have.value', opcodes[2].little);
  });

  it('synchronises and rejects invalid inputs', () => {
    cy.aslpweb();

    cy.getByLabel('little-endian').type('{selectall}' + '41 00 0A AA 1');
    cy.getByLabel('big-endian').should('have.value', '0x01aa0a0041');
    cy.getByLabel('assembly').should('have.value', '');
    cy.contains('bytes input:').should('be.visible').and('have.class', 'stderr');

    cy.getByLabel('assembly').type('{selectall}' + 'an invalid assembly');
    cy.getByLabel('big-endian').should('have.value', '');
    cy.getByLabel('little-endian').should('have.value', '');
    cy.contains('asm input:').should('be.visible').and('have.class', 'stderr');
  });

  it('disassembles', () => {
    cy.aslpweb();
    cy.getByLabel('big-endian').type('{selectall}0xaa030041');
    cy.get('button[type=submit]').click();
    cy.get('.online .output')
      .should('contain', 'aarch64_integer_logical_shiftedreg')
      .and('contain', 'or_bits');
    cy.get('.offline .output')
      .should('contain', 'or_bits');

    cy.getByLabel('assembly').type('{selectall}' + 'add v0.4h, v0.4h, v0.4h');
    cy.get('button[type=submit]').click();
    cy.get('.online .output')
      .should('contain', 'aarch64_vector_arithmetic_binary_uniform_add_wrapping_single_simd')
      .and('not.contain', 'add_vec')
      .and('contain', 'add_bits');
    cy.get('.offline .output')
      .should('contain', 'add_bits');

    cy.getByLabel('vector').check({ force: true });
    cy.get('button[type=submit]').click();
    cy.get('.online .output')
      .should('contain', 'aarch64_vector_arithmetic_binary_uniform_add_wrapping_single_simd')
      .and('contain', 'add_vec');
    cy.get('.offline .output')
      .should('contain', 'add_bits')
      .and('not.contain', 'add_vec');
  });

  it('parses options from url', () => {
    cy.aslpweb('?opcode=0xaa030041&bytes=41+00+03+AA&asm=orr+x1%2C+x2%2C+x3&debug=1');
    cy.get('.online .output')
      .should('contain', 'aarch64_integer_logical_shiftedreg')
      .and('contain', 'or_bits')
      .and('contain', 'dis_decode_case');
  });

  it('reports errors', () => {
    cy.aslpweb();
    cy.getByLabel('big-endian').type('{selectall}0x012341');
    cy.get('button[type=submit]').click();

    Cypress.on('uncaught:exception', () => {
      return false
    });

    cy.get('.online .output')
      .should('contain', 'LibASL.Value.Throw');

    cy.get('.offline .output')
      .should('contain', 'Failure')
      .should('contain', 'exception containing backtrace');
  })

})
