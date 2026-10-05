import { ingredientsSlice, getIngredients } from '../ingredientsSlice';
import { TIngredient } from '@utils-types';
import { bun, main, sauce } from './mocks';

const initialState = {
  items: [] as TIngredient[],
  isLoading: false,
  error: null as string | null
};

const mockIngredients: TIngredient[] = [bun, main, sauce];

describe('ingredientsSlice', () => {
  test('возвращает начальное состояние при неизвестном экшене', () => {
    const state = ingredientsSlice.reducer(undefined, { type: 'UNKNOWN' });

    expect(state).toEqual(initialState);
  });

  describe('getIngredients', () => {
    test('pending: включает загрузку и сбрасывает прошлую ошибку', () => {
      const state = ingredientsSlice.reducer(
        { ...initialState, error: 'Предыдущая ошибка' },
        getIngredients.pending('', undefined)
      );

      expect(state.isLoading).toBe(true);
      expect(state.error).toBeNull();
    });

    test('fulfilled: записывает ингредиенты и снимает загрузку', () => {
      const state = ingredientsSlice.reducer(
        { ...initialState, isLoading: true },
        getIngredients.fulfilled(mockIngredients, '', undefined)
      );

      expect(state.isLoading).toBe(false);
      expect(state.items).toEqual(mockIngredients);
    });

    test('rejected: записывает текст ошибки и снимает загрузку', () => {
      const state = ingredientsSlice.reducer(
        { ...initialState, isLoading: true },
        getIngredients.rejected(new Error('Сервер недоступен'), '', undefined)
      );

      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Сервер недоступен');
    });

    test('rejected: подставляет сообщение по умолчанию', () => {
      const state = ingredientsSlice.reducer(
        { ...initialState, isLoading: true },
        getIngredients.rejected(new Error(), '', undefined)
      );

      expect(state.error).toBe('Не удалось загрузить ингредиенты');
    });

    test('rejected не затирает уже загруженные ингредиенты', () => {
      const state = ingredientsSlice.reducer(
        { ...initialState, items: mockIngredients, isLoading: true },
        getIngredients.rejected(new Error('Сервер недоступен'), '', undefined)
      );

      expect(state.items).toEqual(mockIngredients);
    });
  });
});
