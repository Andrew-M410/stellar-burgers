import { test, expect, Page } from '@playwright/test';
import order from './hars/order.json';
import ingredientsData from './hars/ingredients.json';
import { TIngredient } from './../src/utils/types';

const ingredients = ingredientsData.data as TIngredient[];
const byType = (type: string) => ingredients.find((i) => i.type === type)!;

const addIngredient = (page: Page, id: string) =>
  page
    .getByTestId(`ingredient-${id}`)
    .getByRole('button', { name: 'Добавить' })
    .click();

const openIngredientModal = async (page: Page, ingredient: TIngredient) => {
  await page
    .getByTestId(`ingredient-${ingredient._id}`)
    .getByText(ingredient.name)
    .click();
  await expect(page.getByTestId('modal')).toBeVisible();
};

const BUN = byType('bun');
const MAIN = byType('main');
const SAUCE = byType('sauce');

test.beforeEach(async ({ page, context }) => {
  await context.addCookies([
    {
      name: 'accessToken',
      value: 'Bearer%20test-token',
      domain: 'localhost',
      path: '/'
    }
  ]);

  await page.addInitScript(() =>
    localStorage.setItem('refreshToken', 'test-refresh')
  );

  await page.routeFromHAR('tests/hars/ingredients.har', {
    url: '**/api/ingredients',
    update: false
  });

  await page.routeFromHAR('tests/hars/user.har', {
    url: '**/api/auth/user',
    update: false
  });

  await page.routeFromHAR('tests/hars/order.har', {
    url: '**/api/orders',
    update: false
  });

  await page.goto('/');
  await expect(page.getByText('Соберите бургер')).toBeVisible();
});

test.describe('Добавление ингредиентов в конструктор', () => {
  test('булка добавляется в верхнюю и нижнюю позиции', async ({ page }) => {
    await expect(page.getByText('Выберите булки')).toHaveCount(2);

    await addIngredient(page, BUN._id);

    await expect(page.getByTestId('constructor-bun-top')).toContainText(
      `${BUN.name} (верх)`
    );
    await expect(page.getByTestId('constructor-bun-bottom')).toContainText(
      `${BUN.name} (низ)`
    );
    await expect(page.getByText('Выберите булки')).toHaveCount(0);
  });

  test('начинка и соус добавляются в список', async ({ page }) => {
    const list = page.getByTestId('constructor-ingredients');
    await expect(list).toContainText('Выберите начинку');

    await addIngredient(page, MAIN._id);
    await addIngredient(page, SAUCE._id);

    await expect(list).toContainText(MAIN.name);
    await expect(list).toContainText(SAUCE.name);
    await expect(list).not.toContainText('Выберите начинку');
  });

  test('итоговая цена пересчитывается', async ({ page }) => {
    await addIngredient(page, BUN._id);
    await addIngredient(page, MAIN._id);

    await expect(page.getByTestId('total-price')).toHaveText(
      String(BUN.price * 2 + MAIN.price)
    );
  });
});

test.describe('Модальное окно ингредиента', () => {
  test('открывается и показывает данные выбранного ингредиента', async ({
    page
  }) => {
    await openIngredientModal(page, MAIN);
    const modal = page.getByTestId('modal');

    await expect(modal).toContainText('Детали ингредиента');
    await expect(modal).toContainText(MAIN.name);
    await expect(modal).toContainText(String(MAIN.calories));
    await expect(modal).toContainText(String(MAIN.proteins));
    await expect(modal).toContainText(String(MAIN.fat));
    await expect(modal).toContainText(String(MAIN.carbohydrates));
    await expect(modal).not.toContainText(SAUCE.name);
  });

  test('показывает данные другого ингредиента при клике по нему', async ({
    page
  }) => {
    await openIngredientModal(page, SAUCE);
    const modal = page.getByTestId('modal');

    await expect(modal).toContainText(SAUCE.name);
    await expect(modal).toContainText(String(SAUCE.calories));
    await expect(modal).not.toContainText(MAIN.name);
  });

  test('закрывается по клику на крестик', async ({ page }) => {
    await openIngredientModal(page, MAIN);

    await page.getByTestId('modal-close').click();

    await expect(page.getByTestId('modal')).toBeHidden();
  });

  test('закрывается по клику на оверлей', async ({ page }) => {
    await openIngredientModal(page, MAIN);

    await page.getByTestId('modal-overlay').click({ position: { x: 5, y: 5 } });

    await expect(page.getByTestId('modal')).toBeHidden();
  });
});

test.describe('Оформление заказа', () => {
  test('заказ создаётся, конструктор очищается, модалка закрывается', async ({
    page
  }) => {
    await addIngredient(page, BUN._id);
    await addIngredient(page, MAIN._id);
    await addIngredient(page, SAUCE._id);

    await page.getByTestId('order-button').click();

    const modal = page.getByTestId('modal');
    await expect(modal).toBeVisible();
    await expect(page.getByTestId('order-number')).toHaveText(
      String(order.order.number)
    );

    await page.getByTestId('modal-close').click();
    await expect(modal).toBeHidden();

    await expect(page.getByText('Выберите булки')).toHaveCount(2);
    await expect(page.getByTestId('constructor-ingredients')).toContainText(
      'Выберите начинку'
    );
    await expect(page.getByTestId('total-price')).toHaveText('0');
  });
});
