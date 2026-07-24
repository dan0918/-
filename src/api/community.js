const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api";

export async function fetchCommunities() {
  const response = await fetch(`${API_BASE_URL}/communities`);
  if (!response.ok) {
    throw new Error("Failed to fetch communities");
  }
  return response.json();
}

export async function createListing(communityId, listing) {
  const response = await fetch(`${API_BASE_URL}/communities/${communityId}/listings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(listing)
  });

  if (!response.ok) {
    throw new Error("Failed to create listing");
  }

  return response.json();
}

export async function updateVisitState(communityId, payload) {
  const response = await fetch(`${API_BASE_URL}/communities/${communityId}/visit`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error("Failed to update visit state");
  }

  return response.json();
}
