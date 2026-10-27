import BackendEndpoint from "./endpoints/backend-endpoint";

export default class EndpointProvider {
  static get backend(): BackendEndpoint {
    return new BackendEndpoint();
  }
}
