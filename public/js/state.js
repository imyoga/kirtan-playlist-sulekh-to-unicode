export const state = {
  slug: '',
  playlist: null,
};

export function setPlaylist(playlist) {
  state.playlist = playlist;
}

export function getGroupById(groupId) {
  return state.playlist?.groups?.find((g) => String(g.id) === String(groupId));
}
