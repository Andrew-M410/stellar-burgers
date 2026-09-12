import {
  constructorSlice,
  addBun,
  removeBun,
  addIngredient,
  removeIngredient,
  moveIngredient,
  clearConstructor
} from '../constructorSlice';
import { anotherBun, bun, main, sauce, withId } from './mocks';

const initialState = constructorSlice.getInitialState();

describe('constructorSlice', () => {
  test('возвращает начальное состояние при неизвестном экшене', () => {
    const state = constructorSlice.reducer(undefined, { type: 'UNKNOWN' });

    expect(state).toEqual({ bun: null, ingredients: [] });
  });

  describe('булка', () => {
    test('addBun добавляет булку со сгенерированным id', () => {
      const state = constructorSlice.reducer(initialState, addBun(bun));

      expect(state.bun).toEqual({ ...bun, id: expect.any(String) });
    });

    test('addBun заменяет ранее выбранную булку', () => {
      const first = constructorSlice.reducer(initialState, addBun(bun));
      const second = constructorSlice.reducer(first, addBun(anotherBun));

      expect(second.bun?._id).toBe(anotherBun._id);
    });

    test('addBun не трогает список начинок', () => {
      const state = constructorSlice.reducer(
        { bun: null, ingredients: [withId(main, 'id-1')] },
        addBun(bun)
      );

      expect(state.ingredients).toHaveLength(1);
      expect(state.ingredients[0].id).toBe('id-1');
    });

    test('removeBun очищает булку', () => {
      const state = constructorSlice.reducer(
        { bun: withId(bun, 'id-0'), ingredients: [] },
        removeBun()
      );

      expect(state.bun).toBeNull();
    });
  });

  describe('начинки', () => {
    test('addIngredient добавляет ингредиент в конец списка', () => {
      const withMain = constructorSlice.reducer(
        initialState,
        addIngredient(main)
      );
      const withSauce = constructorSlice.reducer(
        withMain,
        addIngredient(sauce)
      );

      expect(withSauce.ingredients).toHaveLength(2);
      expect(withSauce.ingredients[0]).toEqual({
        ...main,
        id: expect.any(String)
      });
      expect(withSauce.ingredients[1]._id).toBe(sauce._id);
    });

    test('addIngredient даёт разные id одинаковым ингредиентам', () => {
      const first = constructorSlice.reducer(initialState, addIngredient(main));
      const second = constructorSlice.reducer(first, addIngredient(main));

      expect(second.ingredients[0].id).not.toBe(second.ingredients[1].id);
    });

    test('removeIngredient удаляет ингредиент по id', () => {
      const state = constructorSlice.reducer(
        {
          bun: null,
          ingredients: [withId(main, 'id-1'), withId(sauce, 'id-2')]
        },
        removeIngredient('id-1')
      );

      expect(state.ingredients).toHaveLength(1);
      expect(state.ingredients[0].id).toBe('id-2');
    });

    test('removeIngredient c несуществующим id не меняет список', () => {
      const state = constructorSlice.reducer(
        {
          bun: null,
          ingredients: [withId(main, 'id-1'), withId(sauce, 'id-2')]
        },
        removeIngredient('id-42')
      );

      expect(state.ingredients.map((item) => item.id)).toEqual([
        'id-1',
        'id-2'
      ]);
    });
  });

  describe('moveIngredient', () => {
    const filled = {
      bun: null,
      ingredients: [
        withId(main, 'id-1'),
        withId(sauce, 'id-2'),
        withId(anotherBun, 'id-3')
      ]
    };

    test('перемещает ингредиент вниз', () => {
      const state = constructorSlice.reducer(
        filled,
        moveIngredient({ index: 0, direction: 'down' })
      );

      expect(state.ingredients.map((item) => item.id)).toEqual([
        'id-2',
        'id-1',
        'id-3'
      ]);
    });

    test('перемещает ингредиент вверх', () => {
      const state = constructorSlice.reducer(
        filled,
        moveIngredient({ index: 2, direction: 'up' })
      );

      expect(state.ingredients.map((item) => item.id)).toEqual([
        'id-1',
        'id-3',
        'id-2'
      ]);
    });

    test('не меняет порядок на границах списка', () => {
      const up = constructorSlice.reducer(
        filled,
        moveIngredient({ index: 0, direction: 'up' })
      );
      const down = constructorSlice.reducer(
        filled,
        moveIngredient({ index: 2, direction: 'down' })
      );

      expect(up.ingredients.map((item) => item.id)).toEqual([
        'id-1',
        'id-2',
        'id-3'
      ]);
      expect(down.ingredients.map((item) => item.id)).toEqual([
        'id-1',
        'id-2',
        'id-3'
      ]);
    });
  });

  test('clearConstructor очищает булку и начинки', () => {
    const state = constructorSlice.reducer(
      {
        bun: withId(bun, 'id-0'),
        ingredients: [withId(main, 'id-1'), withId(sauce, 'id-2')]
      },
      clearConstructor()
    );

    expect(state).toEqual({ bun: null, ingredients: [] });
  });
});
