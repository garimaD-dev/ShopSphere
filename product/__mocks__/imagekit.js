const mockUpload = jest.fn(async () => ({
  url: 'https://example.com/image.jpg',
  thumbnailUrl: 'https://example.com/thumb.jpg',
  fileId: 'file-123',
}));

const ImageKit = jest.fn().mockImplementation(() => ({
  upload: mockUpload,
}));

module.exports = ImageKit;
