import { ref, watch, type Ref } from "vue";
import {
  searchLocations,
  type SearchResult,
} from "~/lib/location/nominatim";

export function useLocationAutocomplete(
  locationInput: Ref<string>,
  isFocused: Ref<boolean>,
) {
  const locationSuggestions = ref<SearchResult[]>([]);
  const isLocationSearching = ref(false);

  watch(
    [locationInput, isFocused],
    ([inputValue, focused], _, onCleanup) => {
      const query = String(inputValue ?? "").trim();
      if (!focused || query.length < 2) {
        locationSuggestions.value = [];
        isLocationSearching.value = false;
        return;
      }

      let cancelled = false;
      const timer = window.setTimeout(async () => {
        isLocationSearching.value = true;

        try {
          const suggestions = await searchLocations(query, 6);
          if (!cancelled) {
            locationSuggestions.value = suggestions;
          }
        } catch {
          if (!cancelled) {
            locationSuggestions.value = [];
          }
        } finally {
          if (!cancelled) {
            isLocationSearching.value = false;
          }
        }
      }, 220);

      onCleanup(() => {
        cancelled = true;
        window.clearTimeout(timer);
      });
    },
    { immediate: true },
  );

  const clearLocationSuggestions = () => {
    locationSuggestions.value = [];
  };

  return {
    locationSuggestions,
    isLocationSearching,
    clearLocationSuggestions,
  };
}
