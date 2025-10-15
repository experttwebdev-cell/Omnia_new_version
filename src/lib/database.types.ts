export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      shopify_products: {
        Row: {
          id: string
          shopify_id: number
          title: string
          description: string | null
          vendor: string | null
          product_type: string | null
          handle: string | null
          status: string | null
          tags: string | null
          image_url: string | null
          price: number | null
          compare_at_price: number | null
          inventory_quantity: number | null
          raw_data: Json | null
          shop_name: string
          created_at: string | null
          updated_at: string | null
          imported_at: string | null
          store_id: string | null
          currency: string | null
          seo_title: string | null
          seo_description: string | null
          ai_vision_analysis: string | null
          ai_color: string | null
          ai_material: string | null
          length: number | null
          length_unit: string | null
          width: number | null
          width_unit: string | null
          height: number | null
          height_unit: string | null
          other_dimensions: Json | null
          ai_confidence_score: number | null
          enrichment_status: string | null
          last_enriched_at: string | null
          enrichment_error: string | null
          seo_synced_to_shopify: boolean | null
          last_seo_sync_at: string | null
          seo_sync_error: string | null
          category: string | null
          sub_category: string | null
          google_product_category: string | null
          google_gender: string | null
          google_age_group: string | null
          google_mpn: string | null
          google_gtin: string | null
          google_condition: string | null
          google_custom_product: boolean | null
          google_custom_label_0: string | null
          google_custom_label_1: string | null
          google_custom_label_2: string | null
          google_custom_label_3: string | null
          google_custom_label_4: string | null
          google_availability: string | null
          google_brand: string | null
          google_synced_at: string | null
        }
        Insert: {
          id?: string
          shopify_id: number
          title: string
          description?: string | null
          vendor?: string | null
          product_type?: string | null
          handle?: string | null
          status?: string | null
          tags?: string | null
          image_url?: string | null
          price?: number | null
          compare_at_price?: number | null
          inventory_quantity?: number | null
          raw_data?: Json | null
          shop_name: string
          created_at?: string | null
          updated_at?: string | null
          imported_at?: string | null
          store_id?: string | null
          currency?: string | null
          seo_title?: string | null
          seo_description?: string | null
          ai_vision_analysis?: string | null
          ai_color?: string | null
          ai_material?: string | null
          length?: number | null
          length_unit?: string | null
          width?: number | null
          width_unit?: string | null
          height?: number | null
          height_unit?: string | null
          other_dimensions?: Json | null
          ai_confidence_score?: number | null
          enrichment_status?: string | null
          last_enriched_at?: string | null
          enrichment_error?: string | null
          seo_synced_to_shopify?: boolean | null
          last_seo_sync_at?: string | null
          seo_sync_error?: string | null
          category?: string | null
          sub_category?: string | null
          google_product_category?: string | null
          google_gender?: string | null
          google_age_group?: string | null
          google_mpn?: string | null
          google_gtin?: string | null
          google_condition?: string | null
          google_custom_product?: boolean | null
          google_custom_label_0?: string | null
          google_custom_label_1?: string | null
          google_custom_label_2?: string | null
          google_custom_label_3?: string | null
          google_custom_label_4?: string | null
          google_availability?: string | null
          google_brand?: string | null
          google_synced_at?: string | null
        }
        Update: {
          id?: string
          shopify_id?: number
          title?: string
          description?: string | null
          vendor?: string | null
          product_type?: string | null
          handle?: string | null
          status?: string | null
          tags?: string | null
          image_url?: string | null
          price?: number | null
          compare_at_price?: number | null
          inventory_quantity?: number | null
          raw_data?: Json | null
          shop_name?: string
          created_at?: string | null
          updated_at?: string | null
          imported_at?: string | null
          store_id?: string | null
          currency?: string | null
          seo_title?: string | null
          seo_description?: string | null
          ai_vision_analysis?: string | null
          ai_color?: string | null
          ai_material?: string | null
          length?: number | null
          length_unit?: string | null
          width?: number | null
          width_unit?: string | null
          height?: number | null
          height_unit?: string | null
          other_dimensions?: Json | null
          ai_confidence_score?: number | null
          enrichment_status?: string | null
          last_enriched_at?: string | null
          enrichment_error?: string | null
          seo_synced_to_shopify?: boolean | null
          last_seo_sync_at?: string | null
          seo_sync_error?: string | null
          category?: string | null
          sub_category?: string | null
          google_product_category?: string | null
          google_gender?: string | null
          google_age_group?: string | null
          google_mpn?: string | null
          google_gtin?: string | null
          google_condition?: string | null
          google_custom_product?: boolean | null
          google_custom_label_0?: string | null
          google_custom_label_1?: string | null
          google_custom_label_2?: string | null
          google_custom_label_3?: string | null
          google_custom_label_4?: string | null
          google_availability?: string | null
          google_brand?: string | null
          google_synced_at?: string | null
        }
      }
      product_variants: {
        Row: {
          id: string
          product_id: string
          shopify_variant_id: number
          sku: string | null
          title: string
          option1: string | null
          option2: string | null
          option3: string | null
          price: number
          compare_at_price: number | null
          inventory_quantity: number
          weight: number | null
          weight_unit: string | null
          barcode: string | null
          currency: string | null
          image_url: string | null
          raw_data: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          product_id: string
          shopify_variant_id: number
          sku?: string | null
          title: string
          option1?: string | null
          option2?: string | null
          option3?: string | null
          price: number
          compare_at_price?: number | null
          inventory_quantity?: number
          weight?: number | null
          weight_unit?: string | null
          barcode?: string | null
          currency?: string | null
          image_url?: string | null
          raw_data?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          product_id?: string
          shopify_variant_id?: number
          sku?: string | null
          title?: string
          option1?: string | null
          option2?: string | null
          option3?: string | null
          price?: number
          compare_at_price?: number | null
          inventory_quantity?: number
          weight?: number | null
          weight_unit?: string | null
          barcode?: string | null
          currency?: string | null
          image_url?: string | null
          raw_data?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      product_images: {
        Row: {
          id: string
          product_id: string
          shopify_image_id: number
          src: string
          position: number
          alt_text: string | null
          width: number | null
          height: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          product_id: string
          shopify_image_id: number
          src: string
          position?: number
          alt_text?: string | null
          width?: number | null
          height?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          product_id?: string
          shopify_image_id?: number
          src?: string
          position?: number
          alt_text?: string | null
          width?: number | null
          height?: number | null
          created_at?: string | null
        }
      }
      shopify_stores: {
        Row: {
          id: string
          shop_name: string
          api_token: string
          currency: string | null
          enrichment_mode: string | null
          enrichment_frequency: string | null
          language: string | null
          last_sync_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          shop_name: string
          api_token: string
          currency?: string | null
          enrichment_mode?: string | null
          enrichment_frequency?: string | null
          language?: string | null
          last_sync_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          shop_name?: string
          api_token?: string
          currency?: string | null
          enrichment_mode?: string | null
          enrichment_frequency?: string | null
          language?: string | null
          last_sync_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      sync_logs: {
        Row: {
          id: string
          store_id: string | null
          store_name: string | null
          operation_type: string
          status: string
          products_processed: number | null
          products_added: number | null
          products_updated: number | null
          variants_processed: number | null
          started_at: string | null
          completed_at: string | null
          error_message: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          store_id?: string | null
          store_name?: string | null
          operation_type: string
          status: string
          products_processed?: number | null
          products_added?: number | null
          products_updated?: number | null
          variants_processed?: number | null
          started_at?: string | null
          completed_at?: string | null
          error_message?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          store_id?: string | null
          store_name?: string | null
          operation_type?: string
          status?: string
          products_processed?: number | null
          products_added?: number | null
          products_updated?: number | null
          variants_processed?: number | null
          started_at?: string | null
          completed_at?: string | null
          error_message?: string | null
          created_at?: string | null
        }
      }
      blog_opportunities: {
        Row: {
          id: string
          product_id: string
          topic: string
          keywords: string[]
          search_volume: number | null
          competition: string | null
          relevance_score: number | null
          status: string | null
          created_at: string | null
          generated_at: string | null
        }
        Insert: {
          id?: string
          product_id: string
          topic: string
          keywords: string[]
          search_volume?: number | null
          competition?: string | null
          relevance_score?: number | null
          status?: string | null
          created_at?: string | null
          generated_at?: string | null
        }
        Update: {
          id?: string
          product_id?: string
          topic?: string
          keywords?: string[]
          search_volume?: number | null
          competition?: string | null
          relevance_score?: number | null
          status?: string | null
          created_at?: string | null
          generated_at?: string | null
        }
      }
      blog_articles: {
        Row: {
          id: string
          opportunity_id: string | null
          product_id: string
          title: string
          content: string
          excerpt: string | null
          meta_title: string | null
          meta_description: string | null
          keywords: string[]
          status: string | null
          synced_to_shopify: boolean | null
          shopify_blog_id: string | null
          shopify_article_id: string | null
          last_sync_at: string | null
          sync_error: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          opportunity_id?: string | null
          product_id: string
          title: string
          content: string
          excerpt?: string | null
          meta_title?: string | null
          meta_description?: string | null
          keywords?: string[]
          status?: string | null
          synced_to_shopify?: boolean | null
          shopify_blog_id?: string | null
          shopify_article_id?: string | null
          last_sync_at?: string | null
          sync_error?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          opportunity_id?: string | null
          product_id?: string
          title?: string
          content?: string
          excerpt?: string | null
          meta_title?: string | null
          meta_description?: string | null
          keywords?: string[]
          status?: string | null
          synced_to_shopify?: boolean | null
          shopify_blog_id?: string | null
          shopify_article_id?: string | null
          last_sync_at?: string | null
          sync_error?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
