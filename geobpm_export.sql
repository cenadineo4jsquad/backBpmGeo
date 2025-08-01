--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'WIN1252';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: Cenadi-Squad
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO "Cenadi-Squad";

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: Cenadi-Squad
--

COMMENT ON SCHEMA public IS '';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: Cenadi-Squad
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO "Cenadi-Squad";

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: Cenadi-Squad
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    utilisateur_id integer,
    action character varying(100) NOT NULL,
    projet_id integer,
    details jsonb,
    date_action timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.audit_logs OWNER TO "Cenadi-Squad";

--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: Cenadi-Squad
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_logs_id_seq OWNER TO "Cenadi-Squad";

--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Cenadi-Squad
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: etapes_workflow; Type: TABLE; Schema: public; Owner: Cenadi-Squad
--

CREATE TABLE public.etapes_workflow (
    id integer NOT NULL,
    projet_id integer,
    nom character varying(100) NOT NULL,
    ordre integer NOT NULL,
    description text,
    type_validation character varying(50)
);


ALTER TABLE public.etapes_workflow OWNER TO "Cenadi-Squad";

--
-- Name: etapes_workflow_id_seq; Type: SEQUENCE; Schema: public; Owner: Cenadi-Squad
--

CREATE SEQUENCE public.etapes_workflow_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.etapes_workflow_id_seq OWNER TO "Cenadi-Squad";

--
-- Name: etapes_workflow_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Cenadi-Squad
--

ALTER SEQUENCE public.etapes_workflow_id_seq OWNED BY public.etapes_workflow.id;


--
-- Name: extractions; Type: TABLE; Schema: public; Owner: Cenadi-Squad
--

CREATE TABLE public.extractions (
    id integer NOT NULL,
    projet_id integer,
    utilisateur_id integer,
    fichier character varying(255) NOT NULL,
    donnees_extraites jsonb,
    seuil_confiance numeric(5,2),
    statut character varying(20),
    date_extraction timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    workflow_initiated boolean DEFAULT false
);


ALTER TABLE public.extractions OWNER TO "Cenadi-Squad";

--
-- Name: extractions_id_seq; Type: SEQUENCE; Schema: public; Owner: Cenadi-Squad
--

CREATE SEQUENCE public.extractions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.extractions_id_seq OWNER TO "Cenadi-Squad";

--
-- Name: extractions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Cenadi-Squad
--

ALTER SEQUENCE public.extractions_id_seq OWNED BY public.extractions.id;


--
-- Name: localites; Type: TABLE; Schema: public; Owner: Cenadi-Squad
--

CREATE TABLE public.localites (
    id integer NOT NULL,
    type character varying(50) NOT NULL,
    valeur character varying(255) NOT NULL
);


ALTER TABLE public.localites OWNER TO "Cenadi-Squad";

--
-- Name: localites_id_seq; Type: SEQUENCE; Schema: public; Owner: Cenadi-Squad
--

CREATE SEQUENCE public.localites_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.localites_id_seq OWNER TO "Cenadi-Squad";

--
-- Name: localites_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Cenadi-Squad
--

ALTER SEQUENCE public.localites_id_seq OWNED BY public.localites.id;


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: Cenadi-Squad
--

CREATE TABLE public.permissions (
    id integer NOT NULL,
    role_id integer,
    action character varying(100) NOT NULL
);


ALTER TABLE public.permissions OWNER TO "Cenadi-Squad";

--
-- Name: permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: Cenadi-Squad
--

CREATE SEQUENCE public.permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.permissions_id_seq OWNER TO "Cenadi-Squad";

--
-- Name: permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Cenadi-Squad
--

ALTER SEQUENCE public.permissions_id_seq OWNED BY public.permissions.id;


--
-- Name: projets; Type: TABLE; Schema: public; Owner: Cenadi-Squad
--

CREATE TABLE public.projets (
    id integer NOT NULL,
    nom character varying(150) NOT NULL,
    description text,
    date_creation timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.projets OWNER TO "Cenadi-Squad";

--
-- Name: projets_id_seq; Type: SEQUENCE; Schema: public; Owner: Cenadi-Squad
--

CREATE SEQUENCE public.projets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.projets_id_seq OWNER TO "Cenadi-Squad";

--
-- Name: projets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Cenadi-Squad
--

ALTER SEQUENCE public.projets_id_seq OWNED BY public.projets.id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: Cenadi-Squad
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    nom character varying(50) NOT NULL,
    description text
);


ALTER TABLE public.roles OWNER TO "Cenadi-Squad";

--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: Cenadi-Squad
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO "Cenadi-Squad";

--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Cenadi-Squad
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: titres_extractions; Type: TABLE; Schema: public; Owner: Cenadi-Squad
--

CREATE TABLE public.titres_extractions (
    titre_id integer NOT NULL,
    extraction_id integer NOT NULL
);


ALTER TABLE public.titres_extractions OWNER TO "Cenadi-Squad";

--
-- Name: titres_fonciers; Type: TABLE; Schema: public; Owner: Cenadi-Squad
--

CREATE TABLE public.titres_fonciers (
    id integer NOT NULL,
    projet_id integer,
    proprietaire character varying(150),
    superficie numeric(10,2),
    perimetre numeric(10,2),
    coordonnees_gps jsonb,
    centroide jsonb,
    date_ajout timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.titres_fonciers OWNER TO "Cenadi-Squad";

--
-- Name: titres_fonciers_id_seq; Type: SEQUENCE; Schema: public; Owner: Cenadi-Squad
--

CREATE SEQUENCE public.titres_fonciers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.titres_fonciers_id_seq OWNER TO "Cenadi-Squad";

--
-- Name: titres_fonciers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Cenadi-Squad
--

ALTER SEQUENCE public.titres_fonciers_id_seq OWNED BY public.titres_fonciers.id;


--
-- Name: utilisateur_roles; Type: TABLE; Schema: public; Owner: Cenadi-Squad
--

CREATE TABLE public.utilisateur_roles (
    utilisateur_id integer NOT NULL,
    role_id integer NOT NULL
);


ALTER TABLE public.utilisateur_roles OWNER TO "Cenadi-Squad";

--
-- Name: utilisateurs; Type: TABLE; Schema: public; Owner: Cenadi-Squad
--

CREATE TABLE public.utilisateurs (
    id integer NOT NULL,
    nom character varying(100) NOT NULL,
    prenom character varying(100) NOT NULL,
    email character varying(150) NOT NULL,
    mot_de_passe character varying(255) NOT NULL,
    niveau_hierarchique integer NOT NULL,
    date_creation timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    localite_id integer
);


ALTER TABLE public.utilisateurs OWNER TO "Cenadi-Squad";

--
-- Name: utilisateurs_id_seq; Type: SEQUENCE; Schema: public; Owner: Cenadi-Squad
--

CREATE SEQUENCE public.utilisateurs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.utilisateurs_id_seq OWNER TO "Cenadi-Squad";

--
-- Name: utilisateurs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Cenadi-Squad
--

ALTER SEQUENCE public.utilisateurs_id_seq OWNED BY public.utilisateurs.id;


--
-- Name: validations; Type: TABLE; Schema: public; Owner: Cenadi-Squad
--

CREATE TABLE public.validations (
    id integer NOT NULL,
    extraction_id integer,
    utilisateur_id integer,
    statut character varying(20),
    commentaire text,
    date_validation timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.validations OWNER TO "Cenadi-Squad";

--
-- Name: validations_id_seq; Type: SEQUENCE; Schema: public; Owner: Cenadi-Squad
--

CREATE SEQUENCE public.validations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.validations_id_seq OWNER TO "Cenadi-Squad";

--
-- Name: validations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Cenadi-Squad
--

ALTER SEQUENCE public.validations_id_seq OWNED BY public.validations.id;


--
-- Name: workflows; Type: TABLE; Schema: public; Owner: Cenadi-Squad
--

CREATE TABLE public.workflows (
    id integer NOT NULL,
    titre_foncier_id integer,
    projet_id integer,
    etape_nom character varying(100),
    ordre integer,
    utilisateur_id integer,
    date_debut timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    date_fin timestamp(6) without time zone
);


ALTER TABLE public.workflows OWNER TO "Cenadi-Squad";

--
-- Name: workflows_id_seq; Type: SEQUENCE; Schema: public; Owner: Cenadi-Squad
--

CREATE SEQUENCE public.workflows_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.workflows_id_seq OWNER TO "Cenadi-Squad";

--
-- Name: workflows_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Cenadi-Squad
--

ALTER SEQUENCE public.workflows_id_seq OWNED BY public.workflows.id;


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: Cenadi-Squad
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: etapes_workflow id; Type: DEFAULT; Schema: public; Owner: Cenadi-Squad
--

ALTER TABLE ONLY public.etapes_workflow ALTER COLUMN id SET DEFAULT nextval('public.etapes_workflow_id_seq'::regclass);


--
-- Name: extractions id; Type: DEFAULT; Schema: public; Owner: Cenadi-Squad
--

ALTER TABLE ONLY public.extractions ALTER COLUMN id SET DEFAULT nextval('public.extractions_id_seq'::regclass);


--
-- Name: localites id; Type: DEFAULT; Schema: public; Owner: Cenadi-Squad
--

ALTER TABLE ONLY public.localites ALTER COLUMN id SET DEFAULT nextval('public.localites_id_seq'::regclass);


--
-- Name: permissions id; Type: DEFAULT; Schema: public; Owner: Cenadi-Squad
--

ALTER TABLE ONLY public.permissions ALTER COLUMN id SET DEFAULT nextval('public.permissions_id_seq'::regclass);


--
-- Name: projets id; Type: DEFAULT; Schema: public; Owner: Cenadi-Squad
--

ALTER TABLE ONLY public.projets ALTER COLUMN id SET DEFAULT nextval('public.projets_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: Cenadi-Squad
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: titres_fonciers id; Type: DEFAULT; Schema: public; Owner: Cenadi-Squad
--

ALTER TABLE ONLY public.titres_fonciers ALTER COLUMN id SET DEFAULT nextval('public.titres_fonciers_id_seq'::regclass);


--
-- Name: utilisateurs id; Type: DEFAULT; Schema: public; Owner: Cenadi-Squad
--

ALTER TABLE ONLY public.utilisateurs ALTER COLUMN id SET DEFAULT nextval('public.utilisateurs_id_seq'::regclass);


--
-- Name: validations id; Type: DEFAULT; Schema: public; Owner: Cenadi-Squad
--

ALTER TABLE ONLY public.validations ALTER COLUMN id SET DEFAULT nextval('public.validations_id_seq'::regclass);


--
-- Name: workflows id; Type: DEFAULT; Schema: public; Owner: Cenadi-Squad
--

ALTER TABLE ONLY public.workflows ALTER COLUMN id SET DEFAULT nextval('public.workflows_id_seq'::regclass);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: Cenadi-Squad
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
ed66a072-63ad-4278-a2e7-176897566fcd	834770daee655241f7f9b9fcd5a1bc770ae7716e59f255599c3683e3da76745e	2025-07-23 18:04:34.605385+02	20250723160430_add_prenom_to_utilisateurs	\N	\N	2025-07-23 18:04:30.664939+02	1
d0d3dfa1-5d0b-4d65-99f6-ed9a5d7dccc9	4e0795d931df6454f5f6b6a96842aa9e705505906029a5c029a73d0e1bdef0a4	2025-07-23 18:07:07.37344+02	20250723160707_add_localite_id_to_utilisateurs	\N	\N	2025-07-23 18:07:07.31896+02	1
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: Cenadi-Squad
--

COPY public.audit_logs (id, utilisateur_id, action, projet_id, details, date_action) FROM stdin;
\.


--
-- Data for Name: etapes_workflow; Type: TABLE DATA; Schema: public; Owner: Cenadi-Squad
--

COPY public.etapes_workflow (id, projet_id, nom, ordre, description, type_validation) FROM stdin;
\.


--
-- Data for Name: extractions; Type: TABLE DATA; Schema: public; Owner: Cenadi-Squad
--

COPY public.extractions (id, projet_id, utilisateur_id, fichier, donnees_extraites, seuil_confiance, statut, date_extraction, workflow_initiated) FROM stdin;
\.


--
-- Data for Name: localites; Type: TABLE DATA; Schema: public; Owner: Cenadi-Squad
--

COPY public.localites (id, type, valeur) FROM stdin;
1	departement	Département Admin
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: Cenadi-Squad
--

COPY public.permissions (id, role_id, action) FROM stdin;
\.


--
-- Data for Name: projets; Type: TABLE DATA; Schema: public; Owner: Cenadi-Squad
--

COPY public.projets (id, nom, description, date_creation) FROM stdin;
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: Cenadi-Squad
--

COPY public.roles (id, nom, description) FROM stdin;
\.


--
-- Data for Name: titres_extractions; Type: TABLE DATA; Schema: public; Owner: Cenadi-Squad
--

COPY public.titres_extractions (titre_id, extraction_id) FROM stdin;
\.


--
-- Data for Name: titres_fonciers; Type: TABLE DATA; Schema: public; Owner: Cenadi-Squad
--

COPY public.titres_fonciers (id, projet_id, proprietaire, superficie, perimetre, coordonnees_gps, centroide, date_ajout) FROM stdin;
\.


--
-- Data for Name: utilisateur_roles; Type: TABLE DATA; Schema: public; Owner: Cenadi-Squad
--

COPY public.utilisateur_roles (utilisateur_id, role_id) FROM stdin;
\.


--
-- Data for Name: utilisateurs; Type: TABLE DATA; Schema: public; Owner: Cenadi-Squad
--

COPY public.utilisateurs (id, nom, prenom, email, mot_de_passe, niveau_hierarchique, date_creation, localite_id) FROM stdin;
2	Admin	Super	admin@example.com	$2b$10$XQ7ahxiCO1srI66XSDgqFuzt08XH5X2gsy7X/p2/k.rslYRw5osIC	4	2025-07-23 18:39:16.670555	1
\.


--
-- Data for Name: validations; Type: TABLE DATA; Schema: public; Owner: Cenadi-Squad
--

COPY public.validations (id, extraction_id, utilisateur_id, statut, commentaire, date_validation) FROM stdin;
\.


--
-- Data for Name: workflows; Type: TABLE DATA; Schema: public; Owner: Cenadi-Squad
--

COPY public.workflows (id, titre_foncier_id, projet_id, etape_nom, ordre, utilisateur_id, date_debut, date_fin) FROM stdin;
\.


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Cenadi-Squad
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 1, false);


--
-- Name: etapes_workflow_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Cenadi-Squad
--

SELECT pg_catalog.setval('public.etapes_workflow_id_seq', 1, false);


--
-- Name: extractions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Cenadi-Squad
--

SELECT pg_catalog.setval('public.extractions_id_seq', 1, false);


--
-- Name: localites_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Cenadi-Squad
--

SELECT pg_catalog.setval('public.localites_id_seq', 1, true);


--
-- Name: permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Cenadi-Squad
--

SELECT pg_catalog.setval('public.permissions_id_seq', 1, false);


--
-- Name: projets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Cenadi-Squad
--

SELECT pg_catalog.setval('public.projets_id_seq', 1, false);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Cenadi-Squad
--

SELECT pg_catalog.setval('public.roles_id_seq', 1, false);


--
-- Name: titres_fonciers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Cenadi-Squad
--

SELECT pg_catalog.setval('public.titres_fonciers_id_seq', 1, false);


--
-- Name: utilisateurs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Cenadi-Squad
--

SELECT pg_catalog.setval('public.utilisateurs_id_seq', 3, true);


--
-- Name: validations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Cenadi-Squad
--

SELECT pg_catalog.setval('public.validations_id_seq', 1, false);


--
-- Name: workflows_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Cenadi-Squad
--

SELECT pg_catalog.setval('public.workflows_id_seq', 1, false);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: Cenadi-Squad
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: Cenadi-Squad
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: etapes_workflow etapes_workflow_pkey; Type: CONSTRAINT; Schema: public; Owner: Cenadi-Squad
--

ALTER TABLE ONLY public.etapes_workflow
    ADD CONSTRAINT etapes_workflow_pkey PRIMARY KEY (id);


--
-- Name: extractions extractions_pkey; Type: CONSTRAINT; Schema: public; Owner: Cenadi-Squad
--

ALTER TABLE ONLY public.extractions
    ADD CONSTRAINT extractions_pkey PRIMARY KEY (id);


--
-- Name: localites localites_pkey; Type: CONSTRAINT; Schema: public; Owner: Cenadi-Squad
--

ALTER TABLE ONLY public.localites
    ADD CONSTRAINT localites_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: Cenadi-Squad
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: projets projets_pkey; Type: CONSTRAINT; Schema: public; Owner: Cenadi-Squad
--

ALTER TABLE ONLY public.projets
    ADD CONSTRAINT projets_pkey PRIMARY KEY (id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: Cenadi-Squad
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: titres_extractions titres_extractions_pkey; Type: CONSTRAINT; Schema: public; Owner: Cenadi-Squad
--

ALTER TABLE ONLY public.titres_extractions
    ADD CONSTRAINT titres_extractions_pkey PRIMARY KEY (titre_id, extraction_id);


--
-- Name: titres_fonciers titres_fonciers_pkey; Type: CONSTRAINT; Schema: public; Owner: Cenadi-Squad
--

ALTER TABLE ONLY public.titres_fonciers
    ADD CONSTRAINT titres_fonciers_pkey PRIMARY KEY (id);


--
-- Name: utilisateur_roles utilisateur_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: Cenadi-Squad
--

ALTER TABLE ONLY public.utilisateur_roles
    ADD CONSTRAINT utilisateur_roles_pkey PRIMARY KEY (utilisateur_id, role_id);


--
-- Name: utilisateurs utilisateurs_pkey; Type: CONSTRAINT; Schema: public; Owner: Cenadi-Squad
--

ALTER TABLE ONLY public.utilisateurs
    ADD CONSTRAINT utilisateurs_pkey PRIMARY KEY (id);


--
-- Name: validations validations_pkey; Type: CONSTRAINT; Schema: public; Owner: Cenadi-Squad
--

ALTER TABLE ONLY public.validations
    ADD CONSTRAINT validations_pkey PRIMARY KEY (id);


--
-- Name: workflows workflows_pkey; Type: CONSTRAINT; Schema: public; Owner: Cenadi-Squad
--

ALTER TABLE ONLY public.workflows
    ADD CONSTRAINT workflows_pkey PRIMARY KEY (id);


--
-- Name: idx_extractions_date; Type: INDEX; Schema: public; Owner: Cenadi-Squad
--

CREATE INDEX idx_extractions_date ON public.extractions USING btree (date_extraction);


--
-- Name: idx_extractions_statut; Type: INDEX; Schema: public; Owner: Cenadi-Squad
--

CREATE INDEX idx_extractions_statut ON public.extractions USING btree (statut);


--
-- Name: idx_titres_projet; Type: INDEX; Schema: public; Owner: Cenadi-Squad
--

CREATE INDEX idx_titres_projet ON public.titres_fonciers USING btree (projet_id);


--
-- Name: idx_utilisateurs_email; Type: INDEX; Schema: public; Owner: Cenadi-Squad
--

CREATE INDEX idx_utilisateurs_email ON public.utilisateurs USING btree (email);


--
-- Name: localites_type_valeur_key; Type: INDEX; Schema: public; Owner: Cenadi-Squad
--

CREATE UNIQUE INDEX localites_type_valeur_key ON public.localites USING btree (type, valeur);


--
-- Name: permissions_role_id_action_key; Type: INDEX; Schema: public; Owner: Cenadi-Squad
--

CREATE UNIQUE INDEX permissions_role_id_action_key ON public.permissions USING btree (role_id, action);


--
-- Name: roles_nom_key; Type: INDEX; Schema: public; Owner: Cenadi-Squad
--

CREATE UNIQUE INDEX roles_nom_key ON public.roles USING btree (nom);


--
-- Name: utilisateurs_email_key; Type: INDEX; Schema: public; Owner: Cenadi-Squad
--

CREATE UNIQUE INDEX utilisateurs_email_key ON public.utilisateurs USING btree (email);


--
-- Name: audit_logs audit_logs_projet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Cenadi-Squad
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_projet_id_fkey FOREIGN KEY (projet_id) REFERENCES public.projets(id) ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_utilisateur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Cenadi-Squad
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_utilisateur_id_fkey FOREIGN KEY (utilisateur_id) REFERENCES public.utilisateurs(id) ON DELETE SET NULL;


--
-- Name: etapes_workflow etapes_workflow_projet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Cenadi-Squad
--

ALTER TABLE ONLY public.etapes_workflow
    ADD CONSTRAINT etapes_workflow_projet_id_fkey FOREIGN KEY (projet_id) REFERENCES public.projets(id) ON DELETE CASCADE;


--
-- Name: extractions extractions_projet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Cenadi-Squad
--

ALTER TABLE ONLY public.extractions
    ADD CONSTRAINT extractions_projet_id_fkey FOREIGN KEY (projet_id) REFERENCES public.projets(id) ON DELETE CASCADE;


--
-- Name: extractions extractions_utilisateur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Cenadi-Squad
--

ALTER TABLE ONLY public.extractions
    ADD CONSTRAINT extractions_utilisateur_id_fkey FOREIGN KEY (utilisateur_id) REFERENCES public.utilisateurs(id) ON DELETE SET NULL;


--
-- Name: permissions permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Cenadi-Squad
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: titres_extractions titres_extractions_extraction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Cenadi-Squad
--

ALTER TABLE ONLY public.titres_extractions
    ADD CONSTRAINT titres_extractions_extraction_id_fkey FOREIGN KEY (extraction_id) REFERENCES public.extractions(id) ON DELETE CASCADE;


--
-- Name: titres_extractions titres_extractions_titre_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Cenadi-Squad
--

ALTER TABLE ONLY public.titres_extractions
    ADD CONSTRAINT titres_extractions_titre_id_fkey FOREIGN KEY (titre_id) REFERENCES public.titres_fonciers(id) ON DELETE CASCADE;


--
-- Name: titres_fonciers titres_fonciers_projet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Cenadi-Squad
--

ALTER TABLE ONLY public.titres_fonciers
    ADD CONSTRAINT titres_fonciers_projet_id_fkey FOREIGN KEY (projet_id) REFERENCES public.projets(id) ON DELETE CASCADE;


--
-- Name: utilisateur_roles utilisateur_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Cenadi-Squad
--

ALTER TABLE ONLY public.utilisateur_roles
    ADD CONSTRAINT utilisateur_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: utilisateur_roles utilisateur_roles_utilisateur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Cenadi-Squad
--

ALTER TABLE ONLY public.utilisateur_roles
    ADD CONSTRAINT utilisateur_roles_utilisateur_id_fkey FOREIGN KEY (utilisateur_id) REFERENCES public.utilisateurs(id) ON DELETE CASCADE;


--
-- Name: utilisateurs utilisateurs_localite_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Cenadi-Squad
--

ALTER TABLE ONLY public.utilisateurs
    ADD CONSTRAINT utilisateurs_localite_id_fkey FOREIGN KEY (localite_id) REFERENCES public.localites(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: validations validations_extraction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Cenadi-Squad
--

ALTER TABLE ONLY public.validations
    ADD CONSTRAINT validations_extraction_id_fkey FOREIGN KEY (extraction_id) REFERENCES public.extractions(id) ON DELETE CASCADE;


--
-- Name: validations validations_utilisateur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Cenadi-Squad
--

ALTER TABLE ONLY public.validations
    ADD CONSTRAINT validations_utilisateur_id_fkey FOREIGN KEY (utilisateur_id) REFERENCES public.utilisateurs(id) ON DELETE SET NULL;


--
-- Name: workflows workflows_projet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Cenadi-Squad
--

ALTER TABLE ONLY public.workflows
    ADD CONSTRAINT workflows_projet_id_fkey FOREIGN KEY (projet_id) REFERENCES public.projets(id) ON DELETE CASCADE;


--
-- Name: workflows workflows_titre_foncier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Cenadi-Squad
--

ALTER TABLE ONLY public.workflows
    ADD CONSTRAINT workflows_titre_foncier_id_fkey FOREIGN KEY (titre_foncier_id) REFERENCES public.extractions(id) ON DELETE CASCADE;


--
-- Name: workflows workflows_utilisateur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Cenadi-Squad
--

ALTER TABLE ONLY public.workflows
    ADD CONSTRAINT workflows_utilisateur_id_fkey FOREIGN KEY (utilisateur_id) REFERENCES public.utilisateurs(id) ON DELETE SET NULL;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: Cenadi-Squad
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

