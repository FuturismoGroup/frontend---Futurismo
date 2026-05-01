import * as yup from 'yup';

// Esquema para resena: rating 1-5 + comentario opcional
export const reviewSchema = yup.object().shape({
  rating: yup.number()
    .required('La calificacion es requerida')
    .min(1, 'Minimo 1 estrella')
    .max(5, 'Maximo 5 estrellas'),

  comment: yup.string()
    .max(1000, 'Maximo 1000 caracteres')
    .nullable()
});
