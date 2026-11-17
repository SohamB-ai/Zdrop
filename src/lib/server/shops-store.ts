import 'server-only';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { ShopProfile } from '../types';
import { metadataRpc } from './supabase';
import { isCloud } from './store';

const localDir = path.resolve(process.env.ZDROP_DATA_DIR || (process.env.VERCEL ? path.join('/tmp', '.zdrop-data') : '.zdrop-data'));
const localShopsFile = path.join(localDir, 'shops.json');

async function readLocalShops(): Promise<Record<string, ShopProfile>> {
  try {
    const raw = await readFile(localShopsFile, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function writeLocalShops(shops: Record<string, ShopProfile>): Promise<void> {
  await mkdir(localDir, { recursive: true });
  await writeFile(localShopsFile, JSON.stringify(shops, null, 2), 'utf8');
}

export async function createShop(data: {
  ownerId: string;
  ownerEmail: string;
  shopName: string;
  ownerName: string;
  phone: string;
  campusAddress: string;
  shopCode: string;
  pricing?: Partial<import('../types').ShopPricing>;
}): Promise<ShopProfile> {
  const shopId = `shop_${randomUUID()}`;
  const now = Date.now();
  const cleanCode = data.shopCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');

  const shop: ShopProfile = {
    id: shopId,
    ownerId: data.ownerId,
    ownerEmail: data.ownerEmail,
    shopName: data.shopName.trim(),
    ownerName: data.ownerName.trim(),
    phone: data.phone.trim(),
    campusAddress: data.campusAddress.trim(),
    shopCode: cleanCode || `SHOP-${randomUUID().slice(0, 4).toUpperCase()}`,
    createdAt: now,
    isActive: true,
    pricing: {
      bwRate: Math.max(0.1, Number(data.pricing?.bwRate) || 2),
      colorRate: Math.max(0.1, Number(data.pricing?.colorRate) || 10),
      duplexDiscount: Math.max(0, Number(data.pricing?.duplexDiscount) || 0),
      currencySymbol: data.pricing?.currencySymbol?.trim() || '₹',
      upiId: data.pricing?.upiId?.trim() || '',
      payeeName: data.pricing?.payeeName?.trim() || data.shopName.trim(),
    },
  };

  if (isCloud) return metadataRpc<ShopProfile>('zdrop_create_shop', { p_shop: shop });

  const shops = await readLocalShops();
  // Check code uniqueness
  const codeExists = Object.values(shops).some(
    s => s.isActive && s.shopCode.toUpperCase() === shop.shopCode.toUpperCase()
  );
  if (codeExists) {
    throw new Error(`Shop code "${shop.shopCode}" is already taken. Please choose another.`);
  }

  shops[shop.id] = shop;
  await writeLocalShops(shops);
  return shop;
}

export async function getShopByOwnerId(ownerId: string): Promise<ShopProfile | null> {
  if (isCloud) return metadataRpc<ShopProfile | null>('zdrop_get_shop_by_owner', { p_owner_id: ownerId });

  const shops = await readLocalShops();
  return Object.values(shops).find(s => s.isActive && s.ownerId === ownerId) || null;
}

export async function getShopByCode(code: string): Promise<ShopProfile | null> {
  const cleanCode = code.trim().toUpperCase();
  if (isCloud) return metadataRpc<ShopProfile | null>('zdrop_get_shop_by_code', { p_code: cleanCode });

  const shops = await readLocalShops();
  return Object.values(shops).find(s => s.isActive && s.shopCode.toUpperCase() === cleanCode) || null;
}

export async function getShopById(id: string): Promise<ShopProfile | null> {
  if (isCloud) return metadataRpc<ShopProfile | null>('zdrop_get_shop_by_id', { p_shop_id: id });
  const shops = await readLocalShops();
  return shops[id] || null;
}

export async function listShops(): Promise<ShopProfile[]> {
  if (isCloud) return metadataRpc<ShopProfile[]>('zdrop_list_shops');

  const shops = await readLocalShops();
  return Object.values(shops).filter(s => s.isActive);
}

export async function updateShopPricing(
  shop: ShopProfile,
  pricing: Partial<import('../types').ShopPricing>
): Promise<ShopProfile> {
  const updated = { ...shop, pricing: {
    bwRate: Math.max(0.1, Number(pricing.bwRate) || 2),
    colorRate: Math.max(0.1, Number(pricing.colorRate) || 10),
    duplexDiscount: Math.max(0, Number(pricing.duplexDiscount) || 0),
    currencySymbol: pricing.currencySymbol?.trim() || '₹',
    upiId: pricing.upiId?.trim() || '',
    payeeName: pricing.payeeName?.trim() || shop.shopName,
  } };

  if (isCloud) {
    const saved = await metadataRpc<ShopProfile | null>('zdrop_update_shop_pricing', {
      p_shop_id: shop.id,
      p_owner_id: shop.ownerId,
      p_pricing: updated.pricing,
    });
    if (!saved) throw new Error('Shop not found.');
    return saved;
  }

  const shops = await readLocalShops();
  if (!shops[shop.id]) throw new Error('Shop not found.');
  shops[shop.id] = updated;
  await writeLocalShops(shops);
  return updated;
}
