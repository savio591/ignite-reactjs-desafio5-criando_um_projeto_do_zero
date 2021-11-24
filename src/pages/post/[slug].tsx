import { useEffect, useLayoutEffect, useState } from 'react';

import Head from 'next/head';

import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';

import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';

import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { getPrismicClient } from '../../services/prismic';
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  uid: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostFormatted {
  first_publication_date: string | null;
  read_time: string;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: string;
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post: rawPost }: PostProps): JSX.Element {
  const router = useRouter();
  const [post, setPost] = useState<PostFormatted>({} as PostFormatted);

  useLayoutEffect(() => {
    const script = document.createElement('script');
    const anchor = document.getElementById('inject-comments-for-uterances');
    script.setAttribute('src', 'https://utteranc.es/client.js');
    script.setAttribute('crossorigin', 'anonymous');
    script.setAttribute('async', 'true');
    script.setAttribute(
      'repo',
      'https://github.com/savio591/ignite-reactjs-desafio5-criando_um_projeto_do_zero'
    );
    script.setAttribute('issue-term', 'url');
    script.setAttribute('theme', 'preferred-color-scheme');
    anchor.appendChild(script);
  }, []);

  useEffect(() => {
    if (!router.isFallback) {
      setPost({
        ...rawPost,
        first_publication_date: format(
          new Date(rawPost.first_publication_date),
          'dd MMM yyyy',
          {
            locale: ptBR,
          }
        ),
        read_time: '4 min',
        data: {
          ...rawPost.data,
          content: rawPost.data.content.map(section => {
            return {
              ...section,
              body: RichText.asHtml(section.body),
            };
          }),
        },
      });
    }
  }, [rawPost, router.isFallback]);

  if (router.isFallback) {
    return <h1>Carregando...</h1>;
  }

  return post?.data ? (
    <>
      <Head>
        <title>Post | SpaceTraveler</title>
      </Head>
      <main className={commonStyles.container}>
        <>
          <img src={post.data.banner.url} alt="banner" />
          <div className="header">
            <h1>{post.data.title}</h1>
            <div className="info">
              <div>
                <FiCalendar />
                <time>{post.first_publication_date}</time>
              </div>
              <div>
                <FiUser />
                <p>{post.data.author}</p>
              </div>
              <div>
                <FiClock />
                <p>{post.read_time}</p>
              </div>
            </div>
          </div>
          {post.data.content.map(section => {
            return (
              <section key={section.heading}>
                <h1>{section.heading}</h1>
                <div
                  className="body"
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{ __html: section.body }}
                />
              </section>
            );
          })}
          <div id="inject-comments-for-uterances" />
        </>
      </main>
    </>
  ) : (
    <h1>Erro ao carregar página</h1>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {}
  );

  const postsPaths = posts.results.map(post => {
    return {
      params: { slug: post.uid.toString() },
    };
  });

  return {
    paths: postsPaths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  if (!response) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  const post: Post = {
    uid: String(response.uid),
    first_publication_date: response.first_publication_date,
    data: {
      title: String(response.data.title),
      subtitle: response.data.subtitle,
      banner: response.data.banner,
      author: response.data.author,
      content: response.data.content,
    },
  };

  return {
    props: { post },
    revalidate: 60 * 60,
  };
};
