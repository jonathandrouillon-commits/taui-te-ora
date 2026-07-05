export default function Step2Photos({ photos, setPhotos }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-black">Photos</h2>

      <input
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => setPhotos(Array.from(e.target.files || []))}
        className="w-full rounded-2xl bg-[#f8f4ec] p-5"
      />

      <div className="grid gap-4 md:grid-cols-3">
        {photos.map((photo: File, index: number) => (
          <div key={index} className="overflow-hidden rounded-2xl bg-gray-100">
            <img
              src={URL.createObjectURL(photo)}
              className="h-52 w-full object-cover"
              alt="Aperçu"
            />
            {index === 0 && (
              <p className="p-3 text-center font-black text-[#064b42]">
                Photo principale
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}