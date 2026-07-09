export default {
  async redirects() {
    return [
      {
        source: "/associations",
        destination: "/association",
        permanent: true,
      },
    ];
  },
};
