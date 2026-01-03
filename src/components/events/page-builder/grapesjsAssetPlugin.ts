import { Editor } from 'grapesjs';
import { supabase } from '@/integrations/supabase/looseClient';

/**
 * Asset Upload Plugin for GrapesJS
 * Adds drag-and-drop image upload functionality to Supabase Storage
 */
export function assetUploadPlugin(editor: Editor, options: { eventId?: string } = {}) {
  const { eventId } = options;
  const assetManager = editor.AssetManager;

  // Configure asset manager for uploads
  assetManager.getConfig().upload = false; // Disable default upload, we'll use custom
  assetManager.getConfig().dropzone = true;
  assetManager.getConfig().dropzoneContent = `
    <div style="padding: 40px; text-align: center; border: 2px dashed hsl(220, 13%, 30%); border-radius: 12px; margin: 20px;">
      <div style="font-size: 48px; margin-bottom: 16px;">📁</div>
      <p style="color: #fff; font-size: 14px; margin-bottom: 8px;">Drop images here or click to upload</p>
      <p style="color: hsl(215, 20%, 60%); font-size: 12px;">Supports: JPG, PNG, GIF, SVG, WebP</p>
    </div>
  `;

  // Add upload button to asset manager
  const panelManager = editor.Panels;
  panelManager.addButton('options', {
    id: 'open-assets',
    className: 'fa fa-image',
    command: 'open-assets',
    attributes: { title: 'Assets' },
  });

  // Upload file to Supabase Storage
  async function uploadToSupabase(file: File): Promise<string | null> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = eventId ? `events/${eventId}/${fileName}` : `page-builder/${fileName}`;

      const { data, error } = await supabase.storage
        .from('avatars') // Using existing avatars bucket, or create a new one
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Upload error:', error);
        return null;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (err) {
      console.error('Upload failed:', err);
      return null;
    }
  }

  // Create custom asset manager modal content
  function createAssetManagerContent(): HTMLElement {
    const container = document.createElement('div');
    container.style.cssText = `
      padding: 20px;
      min-height: 400px;
    `;

    // Upload zone
    const uploadZone = document.createElement('div');
    uploadZone.style.cssText = `
      padding: 40px;
      text-align: center;
      border: 2px dashed hsl(220, 13%, 30%);
      border-radius: 12px;
      margin-bottom: 24px;
      cursor: pointer;
      transition: all 0.2s ease;
    `;
    uploadZone.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 16px;">📁</div>
      <p style="color: #fff; font-size: 14px; margin-bottom: 8px;">Drop images here or click to upload</p>
      <p style="color: hsl(215, 20%, 60%); font-size: 12px;">Supports: JPG, PNG, GIF, SVG, WebP (max 5MB)</p>
    `;

    // Hidden file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.multiple = true;
    fileInput.style.display = 'none';

    uploadZone.onclick = () => fileInput.click();
    uploadZone.ondragover = (e) => {
      e.preventDefault();
      uploadZone.style.borderColor = 'hsl(221, 83%, 53%)';
      uploadZone.style.background = 'hsla(221, 83%, 53%, 0.1)';
    };
    uploadZone.ondragleave = () => {
      uploadZone.style.borderColor = 'hsl(220, 13%, 30%)';
      uploadZone.style.background = 'transparent';
    };
    uploadZone.ondrop = async (e) => {
      e.preventDefault();
      uploadZone.style.borderColor = 'hsl(220, 13%, 30%)';
      uploadZone.style.background = 'transparent';

      const files = e.dataTransfer?.files;
      if (files) {
        await handleFileUpload(Array.from(files), container);
      }
    };

    fileInput.onchange = async () => {
      if (fileInput.files) {
        await handleFileUpload(Array.from(fileInput.files), container);
      }
    };

    container.appendChild(uploadZone);
    container.appendChild(fileInput);

    // Assets grid
    const assetsLabel = document.createElement('h4');
    assetsLabel.textContent = 'Uploaded Assets';
    assetsLabel.style.cssText = `
      color: #fff;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 16px;
    `;
    container.appendChild(assetsLabel);

    const assetsGrid = document.createElement('div');
    assetsGrid.className = 'assets-grid';
    assetsGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: 12px;
    `;
    container.appendChild(assetsGrid);

    // Render existing assets
    renderAssets(assetsGrid);

    return container;
  }

  async function handleFileUpload(files: File[], container: HTMLElement) {
    const uploadingIndicator = document.createElement('div');
    uploadingIndicator.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: hsl(220, 13%, 15%);
      border: 1px solid hsl(220, 13%, 25%);
      padding: 16px 24px;
      border-radius: 8px;
      color: #fff;
      font-size: 14px;
      z-index: 10000;
    `;
    uploadingIndicator.textContent = 'Uploading...';
    document.body.appendChild(uploadingIndicator);

    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      if (file.size > 5 * 1024 * 1024) {
        alert(`File ${file.name} is too large (max 5MB)`);
        continue;
      }

      const url = await uploadToSupabase(file);
      if (url) {
        assetManager.add({
          src: url,
          name: file.name,
          type: 'image',
        });
      }
    }

    document.body.removeChild(uploadingIndicator);

    // Refresh assets grid
    const assetsGrid = container.querySelector('.assets-grid');
    if (assetsGrid) {
      renderAssets(assetsGrid as HTMLElement);
    }
  }

  function renderAssets(grid: HTMLElement) {
    grid.innerHTML = '';
    const assets = assetManager.getAll();

    if (assets.length === 0) {
      grid.innerHTML = `
        <p style="color: hsl(215, 20%, 50%); font-size: 12px; grid-column: 1/-1; text-align: center; padding: 20px;">
          No assets uploaded yet
        </p>
      `;
      return;
    }

    assets.forEach((asset: any) => {
      const card = document.createElement('div');
      card.style.cssText = `
        background: hsl(220, 13%, 15%);
        border: 1px solid hsl(220, 13%, 22%);
        border-radius: 8px;
        overflow: hidden;
        cursor: pointer;
        transition: all 0.15s ease;
        position: relative;
      `;
      card.onmouseenter = () => {
        card.style.borderColor = 'hsl(221, 83%, 53%)';
      };
      card.onmouseleave = () => {
        card.style.borderColor = 'hsl(220, 13%, 22%)';
      };

      const img = document.createElement('img');
      img.src = asset.get('src');
      img.alt = asset.get('name') || 'Asset';
      img.style.cssText = `
        width: 100%;
        height: 80px;
        object-fit: cover;
      `;

      const name = document.createElement('div');
      name.style.cssText = `
        padding: 8px;
        font-size: 10px;
        color: hsl(215, 20%, 65%);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      `;
      name.textContent = asset.get('name') || 'Unnamed';

      card.appendChild(img);
      card.appendChild(name);

      // Click to insert image
      card.onclick = () => {
        const selected = editor.getSelected();
        if (selected && selected.get('type') === 'image') {
          selected.set('src', asset.get('src'));
        } else {
          editor.addComponents({
            type: 'image',
            src: asset.get('src'),
          });
        }
        editor.Modal.close();
      };

      grid.appendChild(card);
    });
  }

  // Add open assets command
  editor.Commands.add('open-assets', {
    run: () => {
      editor.Modal.setTitle('Asset Manager');
      editor.Modal.setContent(createAssetManagerContent());
      editor.Modal.open();
    },
  });

  // Add default stock images
  assetManager.add([
    { src: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800', name: 'Conference Hall', type: 'image' },
    { src: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800', name: 'Workshop Room', type: 'image' },
    { src: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800', name: 'Team Meeting', type: 'image' },
    { src: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800', name: 'Hackathon', type: 'image' },
    { src: 'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800', name: 'Virtual Event', type: 'image' },
  ]);
}
