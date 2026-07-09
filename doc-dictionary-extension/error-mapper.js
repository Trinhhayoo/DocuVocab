// extension/error-mapper.js

function mapApiErrorToUserMessage(response) {
  if (!response) {
    return "Something went wrong. Please try again.";
  }

  switch (response.status) {
    case "400":
      return response.message ?? "Please check your input.";

    case "401":
      return "Please sign in to save vocabulary.";

    case "403":
      return "You don't have permission to perform this action.";

    case "404":
      return "The requested resource was not found.";

    case "409":
      return response.message ?? "This word has already been saved.";

    case "429":
      return "Too many requests. Please try again later.";

    case "500":
      return "Something went wrong on our server.";

    default:
      return response.message ?? "Unexpected error.";
  }
}