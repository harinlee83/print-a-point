import { getAllowedCountriesForCheckout } from "~~/server/utils/printful";

export default defineEventHandler(async () => {
  const countries = await getAllowedCountriesForCheckout();
  return {
    countries,
  };
});
