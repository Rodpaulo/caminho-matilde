export const STAGES = [
  { id: 'porto', day: 1, from: 'Porto', to: 'Vilarinho', distanceKm: 27, durationText: '6-7h', albergue: 'Albergue de Vilarinho', note: 'Início na Sé. Paragem em Águas Santas.', stampSlug: 'porto' },
  { id: 'vilarinho', day: 2, from: 'Vilarinho', to: 'Barcelos', distanceKm: 27, durationText: '6-7h', albergue: 'Albergue de Barcelos', note: 'Paragem em Rates.', stampSlug: 'vilarinho' },
  { id: 'barcelos', day: 3, from: 'Barcelos', to: 'Ponte de Lima', distanceKm: 34, durationText: '7-8h', albergue: 'Albergue de Ponte de Lima', note: 'Etapa longa. Bebe muita água.', stampSlug: 'barcelos' },
  { id: 'ponte-de-lima', day: 4, from: 'Ponte de Lima', to: 'Rubiães', distanceKm: 18, durationText: '4-5h', albergue: 'Albergue de Rubiães', note: 'Subida exigente. Pés primeiro, pressa depois.', stampSlug: 'ponte-de-lima' },
  { id: 'rubiaes', day: 5, from: 'Rubiães', to: 'Tui', distanceKm: 20, durationText: '5h', albergue: 'Albergue de Tui', note: 'Passagem por Valença — atravessas para Espanha.', stampSlug: 'rubiaes' },
  { id: 'tui', day: 6, from: 'Tui', to: 'O Porriño', distanceKm: 16, durationText: '4h', albergue: 'Albergue municipal', note: 'Etapa curta. Descansa bem.', stampSlug: 'tui' },
  { id: 'porrino', day: 7, from: 'O Porriño', to: 'Redondela', distanceKm: 15, durationText: '4h', albergue: 'Albergue de Redondela', note: 'Boas vistas.', stampSlug: 'porrino' },
  { id: 'redondela', day: 8, from: 'Redondela', to: 'Pontevedra', distanceKm: 20, durationText: '5h', albergue: 'Albergue Virgen Peregrina', note: 'Paragem em Arcade. Prova as ostras se gostares.', stampSlug: 'redondela' },
  { id: 'pontevedra', day: 9, from: 'Pontevedra', to: 'Caldas de Reis', distanceKm: 22, durationText: '5-6h', albergue: 'Albergue de Caldas', note: 'Termas no destino.', stampSlug: 'pontevedra' },
  { id: 'caldas-de-reis', day: 10, from: 'Caldas de Reis', to: 'Padrón', distanceKm: 18, durationText: '4-5h', albergue: 'Albergue de Padrón', note: 'Comida típica: pimentos de Padrón.', stampSlug: 'caldas-de-reis' },
  { id: 'padron', day: 11, from: 'Padrón', to: 'Santiago', distanceKm: 25, durationText: '6-7h', albergue: 'Seminario Menor', note: 'Chegada final. Um pé à frente do outro.', stampSlug: 'padron' },
];

export const PROMPTS = [
  'Quem te fez rir hoje?',
  'Que som do dia queres lembrar?',
  'O que te surpreendeu?',
  'Quem conheceste hoje?',
  'O que te doeu e o que te curou?',
  'Qual foi a melhor coisa que comeste?',
  'O que viste que não havia em lado nenhum?',
  'Um momento em que quase choraste de felicidade ou de cansaço?',
  'Se o dia de hoje fosse uma música, qual seria?',
  'Qual foi o pensamento mais estranho que te passou pela cabeça?',
  'O que é que hoje te fez sentir em casa, longe de casa?',
];